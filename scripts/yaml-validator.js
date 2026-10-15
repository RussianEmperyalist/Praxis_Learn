export function parseYaml(text) {
  const jsyaml = (typeof globalThis !== 'undefined' && globalThis.jsyaml) ? globalThis.jsyaml : null;
  if (!jsyaml) {
    return { data: null, error: 'js-yaml не загружен. Подключите vendor/js-yaml.min.js.' };
  }
  try {
    const data = jsyaml.load(text);
    return { data: data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export function validateCompose(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['YAML не является объектом'], warnings: [], services: [] };
  }

  if (!data.services || typeof data.services !== 'object') {
    errors.push('services обязательно и должно быть объектом');
    return { valid: false, errors, warnings, services: [] };
  }

  const services = Object.keys(data.services);

  if (services.length === 0) {
    errors.push('services должен содержать хотя бы один сервис');
  }

  for (const svcName of services) {
    const svc = data.services[svcName];
    if (!svc) {
      errors.push('сервис ' + svcName + ' пуст');
      continue;
    }

    if (!svc.image && !svc.build) {
      errors.push('сервис ' + svcName + ' требует image или build');
    }

    if (svc.ports) {
      if (!Array.isArray(svc.ports)) {
        errors.push('ports в сервисе ' + svcName + ' должен быть массивом');
      } else {
        for (const p of svc.ports) {
          if (typeof p === 'string') {
            const parts = p.split(':');
            if (parts.length < 2) {
              warnings.push('ports "' + p + '" в сервисе ' + svcName + ': рекомендуется host:container формат');
            }
          }
        }
      }
    }

    if (svc.volumes) {
      if (!Array.isArray(svc.volumes)) {
        errors.push('volumes в сервисе ' + svcName + ' должен быть массивом');
      }
    }

    if (svc.depends_on) {
      if (!Array.isArray(svc.depends_on)) {
        errors.push('depends_on в сервисе ' + svcName + ' должен быть массивом');
      } else {
        for (const dep of svc.depends_on) {
          if (!data.services[dep]) {
            errors.push('depends_on в сервисе ' + svcName + ' ссылается на несуществующий сервис: ' + dep);
          }
        }
      }
    }

    if (svc.build && !svc.image) {
      warnings.push('сервис ' + svcName + ': build без image — образ будет построен');
    }
  }

  if (data.version) {
    warnings.push('version устарел в новых версиях compose и может быть удалён');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    services: services,
  };
}

export function validateK8sManifest(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['YAML не является объектом'], kind: null, name: null, warnings: [] };
  }

  if (!data.apiVersion) {
    errors.push('apiVersion обязателен');
  }

  if (!data.kind) {
    errors.push('kind обязателен');
  }

  if (!data.metadata || !data.metadata.name) {
    errors.push('metadata.name обязательно');
  }

  if (data.kind === 'Deployment') {
    if (!data.spec) {
      errors.push('spec обязателен для Deployment');
    } else {
      if (data.spec.replicas === undefined) {
        errors.push('spec.replicas обязательно для Deployment');
      }
      if (!data.spec.template) {
        errors.push('spec.template обязательно для Deployment');
      }
    }
  }

  if (data.kind === 'Service' && (!data.spec || !data.spec.ports)) {
    errors.push('spec.ports обязательны для Service');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    kind: data.kind || null,
    name: data.metadata?.name || null,
  };
}

export function validateGithubActions(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['YAML не является объектом'], jobs: [] };
  }

  if (!data.on) {
    errors.push('on обязательно');
  }

  if (!data.jobs || typeof data.jobs !== 'object') {
    errors.push('jobs обязательно и должно быть объектом');
    return { valid: false, errors, warnings, jobs: [] };
  }

  const jobs = Object.keys(data.jobs);

  for (const jobName of jobs) {
    const job = data.jobs[jobName];
    if (!job) {
      errors.push('job ' + jobName + ' пуст');
      continue;
    }

    if (!job['runs-on']) {
      errors.push('job ' + jobName + ' требует runs-on');
    }

    if (!job.steps) {
      errors.push('job ' + jobName + ' требует steps');
    } else if (!Array.isArray(job.steps)) {
      errors.push('steps в job ' + jobName + ' должен быть массивом');
    } else {
      for (let i = 0; i < job.steps.length; i++) {
        const step = job.steps[i];
        if (!step['run'] && !step['uses']) {
          warnings.push('step ' + i + ' в job ' + jobName + ': рекомендуется run или uses');
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    jobs: jobs,
  };
}

