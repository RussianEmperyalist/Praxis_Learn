export class DockerfileParser {
  parse(text) {
    const lines = text.split('\n');
    const instructions = [];
    const errors = [];
    const warnings = [];
    let layerCount = 0;
    let foundFrom = false;
    let hasCmd = false;
    let cmdCount = 0;
    let hasEntrypoint = false;
    let entrypointForm = null;
    let hasUser = false;
    let baseImage = null;

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      const lineNum = i + 1;

      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }

      const match = trimmed.match(/^(\S+)(?:\s+(.*))?$/);
      if (!match) continue;

      const instruction = match[1].toUpperCase();
      const args = match[2] ? match[2].trim() : '';

      const entry = {
        instruction,
        args,
        line: lineNum,
        raw: trimmed,
      };

      if (instruction === 'FROM') {
        foundFrom = true;
        const fromParts = args.split(/[: ]/);
        baseImage = fromParts[0];
        const tag = fromParts[1] || 'latest';
        if (!baseImage) {
          errors.push('FROM requires an image name');
        }
      }

      if (instruction === 'RUN') {
        layerCount++;
        if (raw.includes('apt-get') && !raw.includes('--no-install-recommends')) {
          warnings.push('Line ' + lineNum + ': apt-get без --no-install-recommends увеличивает размер образа');
        }
      }

      if (instruction === 'COPY' || instruction === 'ADD') {
        layerCount++;
        if (instruction === 'ADD') {
          if (args.startsWith('http://') || args.startsWith('https://')) {
          } else {
            warnings.push('Line ' + lineNum + ': предпочтительнее COPY вместо ADD для локальных файлов');
          }
        }
      }

      if (instruction === 'CMD') {
        cmdCount++;
        if (cmdCount > 1) {
          errors.push('Dockerfile может содержать только один CMD');
        }
        hasCmd = true;
        if (args.startsWith('[')) {
          entry.form = 'exec';
        } else {
          entry.form = 'shell';
        }
      }

      if (instruction === 'ENTRYPOINT') {
        hasEntrypoint = true;
        if (args.startsWith('[')) {
          entrypointForm = 'exec';
        } else {
          entrypointForm = 'shell';
        }
      }

      if (instruction === 'CMD' && hasEntrypoint) {
        warnings.push('Line ' + lineNum + ': CMD и ENTRYPOINT в сочетании — убедитесь что форматы совместимы');
      }

      if (instruction === 'USER') {
        hasUser = true;
      }

      if (instruction === 'EXPOSE') {
        entry.ports = args.split(/\s+/).filter(Boolean);
      }

      instructions.push(entry);
    }

    if (!foundFrom) {
      errors.push('Dockerfile must start with FROM');
    }

    if (instructions.length > 0 && instructions[0].instruction !== 'FROM') {
      const firstNonComment = instructions.find(i => i.instruction !== 'FROM');
      if (firstNonComment) {
        errors.push('Dockerfile must start with FROM');
      }
    }

    return {
      instructions,
      errors,
      warnings,
      layers: layerCount,
      baseImage,
    };
  }
}

export const parseDockerfile = (text) => new DockerfileParser().parse(text);
