let arvores = [];
let cuttingMode = false;

function setup() {
  createCanvas(800, 600); // Canvas um pouco maior para apreciar melhor as árvores
  background(135, 206, 235);
  textSize(16);
  fill(0);
  textAlign(LEFT, TOP);
}

function draw() {
  background(135, 206, 235);
  drawGround();

  for (let i = arvores.length - 1; i >= 0; i--) {
    arvores[i].grow();
    arvores[i].display();
  }

  fill(0);
  if (cuttingMode) {
    text("Modo: CORTAR (Pressione 'C' para Plantar)", 10, 10);
    cursor(CROSS);
  } else {
    text("Modo: PLANTAR (Pressione 'C' para Cortar)", 10, 10);
    cursor(ARROW);
  }
}

class Arvore {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.maxAge = random(180, 350); // Maior maxAge para crescimento mais gradual
    this.trunkColor = color(90, 60, 10);
    this.leafColor = color(30, 120, 30);
    this.secondaryLeafColor = color(60, 150, 60);
    this.tertiaryLeafColor = color(20, 100, 20); // Nova cor para mais variação

    // Atributos finais da estrutura
    this.finalTrunkHeight = random(180, 300);
    this.finalTrunkWidth = random(20, 40);
    this.finalBranchLevels = floor(random(4, 7)); // Mais níveis de ramificação
    this.trunkCurvature = random(-0.2, 0.2); // Curvatura aleatória do tronco

    this.foliageData = {};
    this.branchData = [];
    this.generateBranchData(this.finalBranchLevels, this.branchData, this.finalTrunkHeight);
  }

  // Passa o comprimento total para gerar a folhagem de forma mais consistente
  generateBranchData(level, parentBranch, parentLen) {
    if (level === 0) {
      let clusterId = Object.keys(this.foliageData).length;
      let clusterDetails = {
        clusterSizeFactor: random(0.8, 1.8), // Maior variação de tamanho
        leaves: []
      };
      let numLeaves = floor(random(15, 30)); // Mais folhas
      for (let i = 0; i < numLeaves; i++) {
        clusterDetails.leaves.push({
          x: random(-0.7, 0.7),
          y: random(-0.7, 0.7),
          diameterFactor: random(0.6, 1.2),
          aspectRatio: random(0.7, 1.3),
          colorChoice: random(1)
        });
      }
      this.foliageData[clusterId] = clusterDetails;
      return clusterId;
    }

    let numBranches = floor(random(2, 5)); // Mais galhos por nível
    for (let i = 0; i < numBranches; i++) {
      let angleOffset = map(i, 0, numBranches - 1, -PI / 3, PI / 3) + random(-0.15, 0.15); // Ângulos mais abertos
      let branchLengthRatio = random(0.5, 0.75); // Galhos mais curtos
      let branchWidthRatio = random(0.5, 0.7);

      let newBranch = {
        angle: angleOffset,
        lenRatio: branchLengthRatio,
        widRatio: branchWidthRatio,
        children: [],
        foliageClusterId: null,
        // Guarda a curvatura para este segmento de galho
        curvature: random(-0.1, 0.1)
      };

      let childResult = this.generateBranchData(level - 1, newBranch.children, parentLen * branchLengthRatio);
      if (level - 1 === 0) {
        newBranch.foliageClusterId = childResult;
      }
      parentBranch.push(newBranch);
    }
  }

  grow() {
    if (this.age < this.maxAge) {
      this.age += 0.5;
    }
  }

  display() {
    push();
    translate(this.x, this.y);

    let currentTrunkHeight = map(this.age, 0, this.maxAge, 5, this.finalTrunkHeight);
    let currentTrunkWidth = map(this.age, 0, this.maxAge, 1, this.finalTrunkWidth);
    let branchGrowthFactor = map(this.age, 0, this.maxAge, 0, 1);

    this.drawTrunk(currentTrunkWidth, currentTrunkHeight);
    // Inicia o desenho dos galhos a partir da altura do tronco
    this.drawBranch(0, -currentTrunkHeight, currentTrunkHeight, currentTrunkWidth * 0.7, this.finalBranchLevels, this.branchData, branchGrowthFactor);

    pop();
  }

  // Desenha o tronco com textura e curvatura
  drawTrunk(wid, len) {
    noFill(); // Começamos sem preenchimento para desenhar as linhas da casca primeiro
    stroke(lerpColor(this.trunkColor, color(0), 0.2)); // Cor mais escura para as linhas
    strokeWeight(1);

    // Desenha várias linhas para simular a casca
    for (let i = 0; i < len; i += 3) {
      let xOffsetLeft = map(i, 0, len, 0, this.trunkCurvature * wid / 2);
      let xOffsetRight = map(i, 0, len, 0, -this.trunkCurvature * wid / 2);

      line(-wid / 2 + xOffsetLeft + random(-1, 1), -len + i,
        wid / 2 + xOffsetRight + random(-1, 1), -len + i + random(-1, 1));
    }

    noStroke();
    fill(this.trunkColor);
    beginShape(); // Para desenhar o tronco com curvatura
    vertex(-wid / 2 + this.trunkCurvature * wid / 2, -len); // Topo esquerdo com curvatura
    vertex(wid / 2 - this.trunkCurvature * wid / 2, -len); // Topo direito com curvatura
    vertex(wid / 2, 0); // Base direita
    vertex(-wid / 2, 0); // Base esquerda
    endShape(CLOSE);
  }

  // drawBranch agora recebe px, py (ponto inicial do galho) e o comprimento total do segmento
  drawBranch(px, py, len, wid, level, currentBranchData, growthFactor) {
    let actualLen = len * growthFactor;
    let actualWid = wid * growthFactor;

    if (actualLen < 1 || actualWid < 0.5) {
      if (level === 0 && this.foliageData[currentBranchData]) {
        this.drawFoliage(0, 0, growthFactor, this.foliageData[currentBranchData]);
      }
      return;
    }

    stroke(lerpColor(this.trunkColor, color(120, 80, 20), (this.maxAge - this.age) / this.maxAge * 0.3));
    strokeWeight(actualWid);

    // Desenha o galho com uma leve curvatura usando bezier
    let cp1x = px + (actualLen * 0.1 * currentBranchData.length > 0 ? currentBranchData[0].curvature : 0);
    let cp1y = py - actualLen * 0.3;
    let cp2x = px + (actualLen * 0.1 * currentBranchData.length > 0 ? currentBranchData[0].curvature : 0);
    let cp2y = py - actualLen * 0.7;
    let endX = px;
    let endY = py - actualLen;

    // Usamos a função bezier para curvar o galho
    bezier(px, py, cp1x, cp1y, cp2x, cp2y, endX, endY);

    push();
    translate(endX, endY); // Move para a ponta do galho atual

    for (let i = 0; i < currentBranchData.length; i++) {
      let branch = currentBranchData[i];
      push();
      rotate(branch.angle);

      if (branch.foliageClusterId !== null) {
        this.drawFoliage(len * branch.lenRatio, wid * branch.widRatio, growthFactor, this.foliageData[branch.foliageClusterId]);
      } else {
        // Chamada recursiva a partir da origem (0,0) que é a ponta do galho pai
        this.drawBranch(0, 0, len * branch.lenRatio, wid * branch.widRatio, level - 1, branch.children, growthFactor);
      }
      pop();
    }
    pop(); // Volta ao estado anterior para o próximo galho irmão
  }

  drawFoliage(branchLen, branchWid, growthFactor, foliageClusterData) {
    let clusterSize = (branchLen + branchWid) * 0.8 * growthFactor * foliageClusterData.clusterSizeFactor;
    if (clusterSize < 8) return; // Aumentei o mínimo para folhas

    noStroke();
    for (let i = 0; i < foliageClusterData.leaves.length; i++) {
      let leaf = foliageClusterData.leaves[i];

      let leafX = leaf.x * clusterSize;
      let leafY = leaf.y * clusterSize;
      let leafDiameter = leaf.diameterFactor * clusterSize * 0.5;

      // Mais variação de cor
      if (leaf.colorChoice < 0.33) {
        fill(this.leafColor);
      } else if (leaf.colorChoice < 0.66) {
        fill(this.secondaryLeafColor);
      } else {
        fill(this.tertiaryLeafColor);
      }

      // Desenha uma forma mais orgânica para a folha (aproximação)
      ellipse(leafX, leafY, leafDiameter, leafDiameter * leaf.aspectRatio);
      // Ou, para uma forma mais complexa:
      // triangle(leafX, leafY - leafDiameter/2, leafX - leafDiameter/2, leafY + leafDiameter/2, leafX + leafDiameter/2, leafY + leafDiameter/2);
    }
  }

  // --- Método isClicked aprimorado ---
  isClicked(px, py) {
    // Primeiro, verifica se o clique está na base da árvore (área do tronco)
    let currentTrunkHeight = map(this.age, 0, this.maxAge, 5, this.finalTrunkHeight);
    let currentTrunkWidth = map(this.age, 0, this.maxAge, 1, this.finalTrunkWidth);

    let trunkLeft = this.x - currentTrunkWidth / 2;
    let trunkRight = this.x + currentTrunkWidth / 2;
    let trunkTop = this.y - currentTrunkHeight;
    let trunkBottom = this.y;

    if (px > trunkLeft && px < trunkRight && py > trunkTop && py < trunkBottom) {
      return true; // Clique no tronco
    }

    // Para a folhagem, podemos usar uma aproximação de círculo maior no topo da árvore
    // O centro da copa é o topo do tronco
    let canopyCenterX = this.x;
    let canopyCenterY = this.y - currentTrunkHeight * 0.5; // Um pouco abaixo do topo para englobar mais galhos
    let canopyRadius = currentTrunkHeight * 0.7; // Raio da copa aproximado

    let d = dist(px, py, canopyCenterX, canopyCenterY);
    if (d < canopyRadius) {
      return true; // Clique na folhagem/copa
    }

    return false; // Não clicou na árvore
  }
}

function drawGround() {
  fill(139, 69, 19);
  noStroke();
  rect(0, height - 50, width, 50);
}

function mouseClicked() {
  if (mouseY > height - 50) {
    if (cuttingMode) {
      for (let i = arvores.length - 1; i >= 0; i--) {
        if (arvores[i].isClicked(mouseX, mouseY)) {
          arvores.splice(i, 1);
          console.log("Árvore cortada!");
          return;
        }
      }
    } else {
      let novaArvore = new Arvore(mouseX, mouseY);
      arvores.push(novaArvore);
    }
  }
}

function keyPressed() {
  if (key === 'c' || key === 'C') {
    cuttingMode = !cuttingMode;
    console.log("Modo de corte: " + cuttingMode);
  }
}
