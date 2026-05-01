const workspace = document.getElementById("workspace");
const svgLayer = document.getElementById("svg-layer");

let activeNode = null;
let offsetX = 0;
let offsetY = 0;
let nodeCounter = 1;

// patch latence drawLines
let needsRedraw = false;
function animationLoop() {
  if (needsRedraw) {
    drawLines();
    needsRedraw = false;
  }
  requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);


function drawLines() {
  while (svgLayer.firstChild) {
    svgLayer.removeChild(svgLayer.firstChild);
  }
  const nodes = document.querySelectorAll(".flow-node");
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes.item(i);
    const parentId = child.getAttribute("data-parent");
    
    if (parentId) {
      const parent = document.getElementById(parentId);
      if (parent) {
        const r1 = parent.getBoundingClientRect();
        const r2 = child.getBoundingClientRect();

        const c1x = r1.left + (r1.width / 2);
        const c1y = r1.top + r1.height;

        const c2x = r2.left + (r2.width / 2);
        const c2y = r2.top;

        const cp1x = c1x;
        const cp1y = c1y + 50;
        const cp2x = c2x;
        const cp2y = c2y - 50;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "flow-line");
        path.setAttribute("d", "M " + c1x + " " + c1y + " C " + cp1x + " " + cp1y + ", " + cp2x + " " + cp2y + ", " + c2x + " " + c2y);
        svgLayer.appendChild(path);
      }
    }
  }
}

function deleteNodeAndChildren(nodeId) {
  const node = document.getElementById(nodeId);
  if (node) {
    node.remove();
  }
  const nodes = document.querySelectorAll(".flow-node");
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes.item(i);
    if (child.getAttribute("data-parent") === nodeId) {
      deleteNodeAndChildren(child.id);
    }
  }
  renumberNodes();
  drawLines();
}
function renumberNodes() {
  const nodes = Array.from(document.querySelectorAll(".flow-node"))
    .filter(n => n.id !== "node-root");

  nodes.sort((a, b) => {
    const na = parseInt(a.id.replace("node-", ""), 10);
    const nb = parseInt(b.id.replace("node-", ""), 10);
    return na - nb;
  });

  let index = 1;
  nodes.forEach(node => {
    const title = node.querySelector(".node-header .editable");
    if (title) {
        title.innerText = "Step " + index;
    }
    index++;
  });
}
function getNextNodeId() {
  const nodes = document.querySelectorAll(".flow-node");
  let max = 0;

  nodes.forEach(n => {
    const id = n.id.replace("node-", "");
    const num = parseInt(id, 10);
    if (!isNaN(num) && num > max) max = num;
  });

  return "node-" + (max + 1);
}

function startDrag(e, node) {
  if (e.target.classList.contains("editable") || e.target.classList.contains("delete-btn") || e.target.classList.contains("add-node-btn")) {
    return;
  }
  activeNode = node;
  const rect = node.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  node.style.zIndex = 100;
}
function attachListeners(node) {
  node.addEventListener("pointerdown", function(e) {
    startDrag(e, node);
  });
  
  const delBtn = node.querySelector(".delete-btn");
  if (delBtn) {
    delBtn.addEventListener("click", function() {
      deleteNodeAndChildren(node.id);
      drawLines();
    });
  }
  
  const addBtn = node.querySelector(".add-node-btn");
  if (addBtn) {
    addBtn.addEventListener("click", function() {
      createNewNode(node.id);
    });
  }
  
  const editables = node.querySelectorAll(".editable");
  for (let i = 0; i < editables.length; i++) {
    editables.item(i).addEventListener("pointerdown", function(e) {
      e.stopPropagation();
    });
    editables.item(i).addEventListener("input", function() {
      drawLines();
    });
  }
}
function createNewNode(parentId) {
  const parent = document.getElementById(parentId);
  const pr = parent.getBoundingClientRect();
  
  const newNode = document.createElement("div");
  const newId = getNextNodeId();
  newNode.id = newId;
  newNode.className = "flow-node";
  newNode.setAttribute("data-parent", parentId);
  
  const newX = pr.left + (Math.random() * 100 - 50);
  const newY = pr.top + 150;
  
  newNode.style.left = newX + "px";
  newNode.style.top = newY + "px";
  
  const header = document.createElement("div");
  header.className = "node-header";
  
  const title = document.createElement("div");
  title.className = "editable";
  title.setAttribute("contenteditable", "true");
  title.innerText = ""; 
  
  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.innerText = "×";
  
  header.appendChild(title);
  header.appendChild(delBtn);
  
  const bodyDiv = document.createElement("div");
  bodyDiv.className = "node-body editable";
  bodyDiv.setAttribute("contenteditable", "true");
  bodyDiv.innerText = "Entrer les details ici...";
  
  const addBtn = document.createElement("button");
  addBtn.className = "add-node-btn";
  addBtn.innerText = "+";
  
  newNode.appendChild(header);
  newNode.appendChild(bodyDiv);
  newNode.appendChild(addBtn);
  
  workspace.appendChild(newNode);
  attachListeners(newNode);
  renumberNodes();
  drawLines();
}

const rootNode = document.getElementById("node-root");
attachListeners(rootNode);

window.addEventListener("pointermove", function(e) {
  if (!activeNode) return;

  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;

  activeNode.style.left = x + "px";
  activeNode.style.top = y + "px";

  needsRedraw = true;
});

window.addEventListener("pointerup", function() {
  if (activeNode) {
    activeNode.style.zIndex = 10;
    activeNode = null;
  }
});
window.addEventListener("resize", drawLines);
setTimeout(drawLines, 100);


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
