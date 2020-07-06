import * as path from 'path';
import { template, TemplateExecutor } from 'lodash';
import * as fs from 'fs';

const TMPL_BASE_PATH = path.join(__dirname, 'template');

const templateCache: { [template: string]: TemplateExecutor } = {};

export function renderTemplate(templateName: string, params: { [key: string]: any }): string {
  const template: TemplateExecutor =
    templateCache[templateName] || (templateCache[templateName] = compile(templateName));

  return template(params);
}

export function compile(templateName: string): TemplateExecutor {
  return template(fs.readFileSync(path.join(TMPL_BASE_PATH, templateName), 'utf8'));
}
