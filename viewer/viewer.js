import display from "../src/display";
import generate from "../src/generate";
import svgsIndex from "../src/svgs-index";

const faceWrapper = document.getElementById("face");
let face;
if (location.hash.length <= 1) {
  face = generate();
} else {
  try {
    face = JSON.parse(atob(location.hash.slice(1)));
  } catch (error) {
    console.error(error);
    face = generate();
  }
}

const updateDisplay = () => {
  console.log(face);
  display(faceWrapper, face);
  history.replaceState(undefined, undefined, `#${btoa(JSON.stringify(face))}`);
};

const initializeSelectOptions = () => {
  for (const feature of Object.keys(svgsIndex)) {
    const options = svgsIndex[feature];
    const selectElement = document.getElementById(`${feature}-id`);
    for (const option of options) {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.text = option;
      selectElement.add(optionElement, null);
    }
  }
};

const isValue = obj =>
  typeof obj === "boolean" ||
  typeof obj === "number" ||
  typeof obj === "string";

const initializeFormValue = (id, value) => {
  const element = document.getElementById(id);
  if (element.classList.contains("form-check-input")) {
    element.checked = value;
  } else {
    element.value = value;
  }
};

const initializeFormValues = () => {
  for (const key of Object.keys(face)) {
    if (isValue(face[key])) {
      initializeFormValue(key, face[key]);
    } else {
      for (const key2 of Object.keys(face[key])) {
        if (isValue(face[key][key2])) {
          initializeFormValue(`${key}-${key2}`, face[key][key2]);
        } else {
          throw new Error(`wtf is in face.${key}.${key2}`);
        }
      }
    }
  }
};

const getValue = (oldValue, event) => {
  if (typeof oldValue === "number") {
    return parseFloat(event.target.value);
  }
  if (typeof oldValue === "boolean") {
    return event.target.checked;
  }
  return event.target.value;
};
const listenForChanges = () => {
  const textInputs = document.querySelectorAll("input.form-control");
  const checkboxInputs = document.querySelectorAll("input.form-check-input");
  const selects = document.querySelectorAll("select.form-control");

  for (const input of [...textInputs, ...checkboxInputs, ...selects]) {
    input.addEventListener("change", event => {
      const parts = event.target.id.split("-");

      if (parts.length === 1) {
        face[parts[0]] = getValue(face[parts[0]], event);
      } else if (parts.length === 2) {
        face[parts[0]][parts[1]] = getValue(face[parts[0]][parts[1]], event);
      } else {
        throw new Error(`Invalid ID ${event.target.id}`);
      }

      updateDisplay();
    });
  }

  document.getElementById("randomize").addEventListener("click", () => {
    face = generate();
    initializeFormValues();
    updateDisplay();
  });
};

updateDisplay();
initializeSelectOptions();
initializeFormValues();
listenForChanges();

// Reload when something changes
const socket = new WebSocket("ws://localhost:3001/");
socket.addEventListener("message", event => {
  if (event.data === "reload") {
    location.reload();
  }
});