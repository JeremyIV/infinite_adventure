import re
import colorama
from colorama import Fore, Back, Style, init
import os
import openai
import textwrap

# Initialize colorama
init(autoreset=True)

system_prompt = '''
You are an AI that generates a text adventure game. 
You provide an initial situation in a structured XML format, and then respond to user input.

Your XML output will be parsed in a UI which is displayed to the user. Your output has the format:

<game>
    <description>
        You find yourself behind a locked <object>door</object>.
        an old <item>key</item> sits in the corner....
   </description>
</game>

You can include <item>s in the description, for example <item>key</item>. 
The player can, for example, say "get key", and this key will be added to their inventory.

The player has an inventory of items, and can interact with the game by choosing an item from their inventory and one of the objects in your description.

For example, if I am in a room with a locked door and I have a crowbar,
I could say "use crowbar on door".

Assume the user input has been validated; you can assume that the item is in the player's inventory.

The first description should contain at least one item, and every description should 
contain at least three objects.
'''

openai.api_key = os.getenv('OPENAI_API_KEY')

def call_chatGPT(system_prompt, assistant_responses, user_responses):
    '''
    Sends an API call to ChatGPT using the "roles" format for messages and returns the assistant's next response.
    
    Parameters:
    - system_prompt: Initial system prompt.
    - assistant_responses: List of assistant's responses in order.
    - user_responses: List of user's responses in order.
    
    Returns:
    - The assistant's response as a string.
    '''
    # Initialize the messages list with the system prompt
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add user and assistant messages to the list
    for user_msg, assistant_msg in zip(user_responses, assistant_responses):
        messages.append({"role": "assistant", "content": assistant_msg})
        messages.append({"role": "user", "content": user_msg})

    # Create the chat completion request
    response = openai.ChatCompletion.create(
        model="gpt-4",  # Make sure to use the correct model
        messages=messages
    )

    # Extract and return the text of the last response
    return response['choices'][0]['message']['content']

def grab_description(response_text):
    '''
    Extracts the content of the <description> tag from the given text.
    
    Parameters:
    - response_text: A string containing the response text with <description> tags.
    
    Returns:
    - The string contents of the first <description> tag found, or an empty string if none is found.
    '''
    # Regular expression to match <description>...</description> and capture the contents
    match = re.search(r'<description>(.*?)</description>', response_text, re.DOTALL)
    
    # If a match is found, return the contents of the <description> tag, otherwise return an empty string
    if match:
        return match.group(1).strip()  # .strip() removes leading/trailing whitespace
    else:
        return ""

def format_text_to_columns(text, width=60):
    text = re.sub(r"\s+", " ", text)
    # Use textwrap.fill to wrap the text to the specified width
    formatted_text = textwrap.fill(text, width=width)
    return formatted_text

def print_description(description):
    description = format_text_to_columns(description)
    # Replace the <object> tags with red text on a blue background, and <item> tags with green text
    description_colored = description.replace('<object>', Fore.WHITE + Back.BLACK).replace('</object>', Style.RESET_ALL)
    description_colored = description_colored.replace('<item>', Fore.WHITE + Back.BLUE).replace('</item>', Style.RESET_ALL)

    print(description_colored)

def get_objects(xml_string):
    # Use a regular expression to find all occurrences of <object>text</object>
    objects = re.findall(r'<object>(.*?)</object>', xml_string)
    return objects

def get_items(xml_string):
    # Use a regular expression to find all occurrences of <item>text</item>
    items = re.findall(r'<item>(.*?)</item>', xml_string)
    return items

def print_inventory(inventory):
    print("Inventory: ")
    print("------------------")
    print(",\n".join(inventory))
    print("------------------")

def get_user_response(items, objects, inventory):
    # Get user input
    while True:
        print_inventory(inventory)
        user_input = input("What do you want to do? ").strip().lower()

        # Process user input
        if user_input.startswith("get "):
            item_to_get = user_input.replace("get ", "", 1)
            if item_to_get in items:
                inventory.append(item_to_get)
                print(f"You picked up the {item_to_get}.")
            else:
                print(f"The {item_to_get} is not here.")
        elif user_input.startswith("use "):
            item_to_use = user_input.replace("use ", "", 1)
            object_to_use_on = input("on? ").strip().lower()

            if item_to_use in inventory and object_to_use_on in objects:
                return f'use "{item_to_use}" on "{object_to_use_on}"'
            else:
                if item_to_use not in inventory:
                    print("You don't have a " + item_to_use + ".")
                if object_to_use_on not in objects:
                    print("There's no " + object_to_use_on + " here.")
        else:
            print("I didn't understand that.")

inventory = ["walk"]
assistant_responses = []
user_responses = []

while True:
    response = call_chatGPT(system_prompt, assistant_responses, user_responses)
    assistant_responses.append(response)

    description = grab_description(response)
    # TODO: remvoe <item> tags for any items in the description which are already in the inventory.
    objects = get_objects(response)
    items = get_items(response)
    print_description(description)
    user_responses.append(get_user_response(items, objects, inventory))

