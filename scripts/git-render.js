const BRANCH_COLORS = {
  main: '#00f0ff',
  master: '#00f0ff',
  feature: '#fcee0a',
  develop: '#ff00d4',
  release: '#ff6b00',
};

const DEFAULT_COLORS = ['#ff003c', '#00ff9f', '#ff6b00', '#aa00ff', '#ff00d4'];

export function renderGraph(state, container) {
  if (!container) return;

  const commits = [...state.commits];
  if (commits.length === 0) {
    container.innerHTML = '<div class="git-graph-empty">Нет коммитов</div>';
    return;
  }

  const reversed = commits.reverse();
  const colors = _assignBranchColors(state);
  const positions = _calculatePositions(reversed, colors);

  const maxY = Math.max(...positions.map(p => p.y), 0);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', Math.max(maxY + 80, 200));
  svg.classList.add('git-graph-svg');

  const branchNames = Object.keys(state.branches);
  const headName = state.head?.name || 'DETACHED';

  reversed.forEach((commit, i) => {
    const pos = positions[i];
    const color = colors._branchColors[commit._branchName] || '#888888';
    const isHead = state.head?.type === 'branch'
      ? state.branches[state.head.name] === commit.hash
      : false;
    const isCurrentCommit = state.head?.type === 'commit' && state.head.hash === commit.hash;
    const isHeadCommit = isHead || isCurrentCommit;

    if (commit.parent) {
      const parentPos = positions.find(p => p.hash === commit.parent);
      if (parentPos) {
        const x1 = parentPos.x;
        const y1 = parentPos.y + 20;
        const x2 = pos.x;
        const y2 = pos.y - 20;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1 + 20);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2 + 20);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }
    }

    if (commit.parent2) {
      const parent2Pos = positions.find(p => p.hash === commit.parent2);
      if (parent2Pos) {
        const x1 = parent2Pos.x;
        const y1 = parent2Pos.y + 20;
        const x2 = pos.x;
        const y2 = pos.y - 20;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1 + 20);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2 + 20);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#888888');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '4');
        svg.appendChild(line);
      }
    }

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', pos.x + 20);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', commit.parent2 ? 14 : 10);
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', isHeadCommit ? '#ffffff' : 'none');
    circle.setAttribute('stroke-width', '3');
    svg.appendChild(circle);

    if (isHeadCommit) {
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', pos.x + 40);
      label.setAttribute('y', pos.y + 4);
      label.setAttribute('fill', '#ffffff');
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('font-size', '12');
      label.textContent = `HEAD → ${headName}`;
      svg.appendChild(label);
    }

    const hashText = document.createElementNS(svgNS, 'text');
    hashText.setAttribute('x', pos.x + 36);
    hashText.setAttribute('y', pos.y + 4);
    hashText.setAttribute('fill', '#e0e6f0');
    hashText.setAttribute('font-family', 'monospace');
    hashText.setAttribute('font-size', '11');
    hashText.textContent = commit.hash;
    svg.appendChild(hashText);

    const msgText = document.createElementNS(svgNS, 'text');
    msgText.setAttribute('x', pos.x + 140);
    msgText.setAttribute('y', pos.y + 4);
    msgText.setAttribute('fill', '#e0e6f0');
    msgText.setAttribute('font-family', 'monospace');
    msgText.setAttribute('font-size', '11');
    const displayMsg = commit.message.length > 30
      ? commit.message.substring(0, 30) + '...'
      : commit.message;
    msgText.textContent = displayMsg;
    svg.appendChild(msgText);
  });

  branchNames.forEach(name => {
    const hash = state.branches[name];
    if (!hash) return;
    const commitPos = positions.find(p => p.hash === hash);
    if (commitPos) {
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', 10);
      label.setAttribute('y', commitPos.y + 4);
      label.setAttribute('fill', colors._branchColors[name] || '#888');
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('font-size', '12');
      label.setAttribute('font-weight', 'bold');
      label.textContent = name;
      svg.appendChild(label);

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', 40);
      line.setAttribute('y1', commitPos.y);
      line.setAttribute('x2', commitPos.x + 10);
      line.setAttribute('y2', commitPos.y);
      line.setAttribute('stroke', colors._branchColors[name] || '#888');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '2,3');
      svg.appendChild(line);
    }
  });

  container.innerHTML = '';
  container.classList.add('git-graph');
  container.appendChild(svg);

  if (maxY > 400) {
    container.classList.add('git-graph-scroll');
  }
}

function _assignBranchColors(state) {
  const branchColors = {};
  const branches = Object.keys(state.branches);

  branches.forEach((name, i) => {
    branchColors[name] = BRANCH_COLORS[name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
  });

  state.commits.forEach(commit => {
    let assigned = false;
    for (const [bName, bHash] of Object.entries(state.branches)) {
      if (bHash === commit.hash) {
        commit._branchName = bName;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      if (commit.parent2) {
        commit._branchName = state.head?.type === 'branch' ? state.head.name : 'merge';
      } else if (i > 0) {
        const prevCommit = state.commits[state.commits.length - 1 - i];
        commit._branchName = prevCommit._branchName || 'main';
      } else {
        commit._branchName = state.head?.type === 'branch' ? state.head.name : 'main';
      }
    }
  });

  return { _branchColor: branchColors };
}

function _calculatePositions(commits, colorInfo) {
  const positions = [];
  const colMap = new Map();
  let col = 0;

  const branchCols = new Map();
  let maxCol = 0;

  commits.forEach((commit, i) => {
    const bName = commit._branchName || 'main';
    if (!branchCols.has(bName)) {
      branchCols.set(bName, maxCol);
      maxCol++;
    }
    const x = branchCols.get(bName) * 180;
    positions.push({
      hash: commit.hash,
      x,
      y: i * 60,
    });
  });

  return positions;
}

export function clearGraph(container) {
  if (container) {
    container.innerHTML = '';
    container.classList.remove('git-graph', 'git-graph-scroll');
  }
}
