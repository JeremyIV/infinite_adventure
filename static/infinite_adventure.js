document.addEventListener("DOMContentLoaded", () => {
  const storyElement = document.getElementById("story");
  const imageContainer = document.getElementById("image-container");
  const inventoryElement = document.getElementById("inventory");
  const objectsElement = document.getElementById("objects");
  const itemInput = document.getElementById("item-input");
  const objectInput = document.getElementById("object-input");
  const useButton = document.getElementById("use-button");

  function startGame() {
    fetch("/start")
      .then((response) => response.json())
      .then((data) => {
        updateGameState(data);
      });
  }

  function useItem() {
    const item = itemInput.value;
    const object = objectInput.value;

    // TODO: append action div to story element. This is a little styled
    // div containing the text "use X on Y"
    const actionElement = document.createElement("div");
    actionElement.classList.add("action");
    actionElement.textContent = `Use ${item} on ${object}`;
    storyElement.appendChild(actionElement);

    fetch("/act", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item, object }),
    })
      .then((response) => response.json())
      .then((data) => {
        updateGameState(data);
      });
  }
  function updateGameState(data) {
    console.log(data);

    const modifiedStoryText = data.story_text.replace(
      /<object>(.*?)<\/object>/g,
      (match, objectName) => {
        return `<span class="object" id="${objectName
          .toLowerCase()
          .replace(/\s/g, "-")}">${objectName}</span>`;
      }
    );

    const storyTextElement = document.createElement("div");
    storyTextElement.classList.add("storytext");

    if (data.image_url) {
      const imageElement = document.createElement("img");
      imageElement.src = data.image_url;
      imageContainer.innerHTML = "";
      storyTextElement.appendChild(imageElement);
      storyTextElement.appendChild(document.createElement("br")); // Add a line break after the image
    }

    const textElement = document.createElement("div");
    textElement.innerHTML = modifiedStoryText;
    storyTextElement.appendChild(textElement);

    storyElement.appendChild(storyTextElement);

    const objectElements = storyElement.querySelectorAll(".object");
    objectElements.forEach((objectElement) => {
      objectElement.addEventListener("click", () => {
        objectInput.value = objectElement.textContent;
      });
    });

    // Run the logic across the entire story element
    const allObjectElements = storyElement.querySelectorAll(".object");
    allObjectElements.forEach((objectElement) => {
      const objectName = objectElement.textContent;

      if (!data.objects.includes(objectName)) {
        const textNode = document.createTextNode(objectElement.textContent);
        objectElement.parentNode.replaceChild(textNode, objectElement);
      }
    });

    inventoryElement.innerHTML = "";

    data.inventory.forEach((item) => {
      const itemElement = document.createElement("span");
      itemElement.classList.add("item");
      itemElement.textContent = item;
      itemElement.addEventListener("click", () => {
        itemInput.value = item;
      });
      inventoryElement.appendChild(itemElement);
    });
  }

  startGame();
  useButton.addEventListener("click", useItem);
});
