from flask import (
    Flask,
    session,
    redirect,
    url_for,
    request,
    send_file,
    send_from_directory,
)
from ai_api import get_AI_response, generate_image, get_hash_string
import json
import re
from pathlib import Path
import os

app = Flask(__name__)
app.secret_key = "INFINITE ADVENTURE"

object_re = re.compile(r"<object>(.*?)</object>")

next_session_id = 0
session_data = {}


def new_state(state, player_prompt):
    print("################################")
    print(player_prompt)
    if player_prompt is not None:
        state["user_responses"].append(player_prompt)
    response = get_AI_response(
        state["system_prompt"], state["assistant_responses"], state["user_responses"]
    )

    print("Response -------------")
    print(response)
    print("----------------------")
    # update assistant_responses
    data = json.loads(response)
    if data["no_progress"]:
        state["user_responses"].pop(-1)
    else:
        state["assistant_responses"].append(response)

    # update current_objects
    if data["new_scene"]:
        state["objects"] = set()

    new_objects = object_re.findall(data["story_text"])
    state["objects"] = sorted(
        (set(state["objects"]) | set(new_objects)) - set(data["remove_objects"])
    )

    # update inventory
    state["inventory"] = sorted(
        (set(state["inventory"]) | set(data["new_items"])) - set(data["remove_items"])
    )

    image_url = None

    if data["image_prompt"]:
        hash_str = get_hash_string(data["image_prompt"])
        image_url = f"image/{hash_str}.png"
        state["image_prompts"][hash_str] = data["image_prompt"]

    result = {
        "image_url": image_url,
        "new_scene": data["new_scene"],
        "story_text": data["story_text"],
        "inventory": state["inventory"],
        "objects": state["objects"],
    }

    return result


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)


@app.route("/image/<path:filename>")
def serve_image(filename):
    state = session_data[session["id"]]
    image_path = Path("cache/images") / filename

    if image_path.exists():
        return send_from_directory("cache/images", filename)
    hash_str = filename[: -len(".png")]
    print("Getting image!!!")
    print(state["image_prompts"])
    print(hash_str)
    prompt = state["image_prompts"][hash_str]
    print(prompt)
    generate_image(prompt)
    return send_from_directory("cache/images", filename)


@app.route("/")
def home():
    return send_file("static/index.html")


@app.route("/start")
def start():
    global next_session_id
    print("STARTING!!")
    state = {}
    state["inventory"] = []
    state["objects"] = []
    state["system_prompt"] = open("system_prompts/system_prompt.txt").read()
    state["assistant_responses"] = []
    state["user_responses"] = []
    state["image_prompts"] = {}

    session_id = next_session_id
    next_session_id += 1
    session["id"] = session_id
    session_data[session_id] = state

    result = new_state(state, None)
    print("Starting result")
    print(result)
    return result


@app.post("/act")
def act():
    data = request.get_json()
    item = data.get("item")
    object_name = data.get("object")
    print("Acting!!")
    print(f"use {item} on {object_name}")
    state = session_data[session["id"]]
    print(state["assistant_responses"])
    print(state["user_responses"])

    if item not in state["inventory"]:
        return {
            "image_url": None,
            "new_scene": False,
            "story_text": f"You have no {item}.",
            "inventory": state["inventory"],
            "objects": state["objects"],
        }
    if object_name not in state["objects"]:
        return {
            "image_url": None,
            "new_scene": False,
            "story_text": f"There is no {object_name} here.",
            "inventory": state["inventory"],
            "objects": state["objects"],
        }

    user_response = f"use {item} on {object_name}"

    return new_state(state, user_response)


if __name__ == "__main__":
    app.run(debug=True, port=os.environ.get("PORT"))
