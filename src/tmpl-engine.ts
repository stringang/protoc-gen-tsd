import * as path from 'path';
import * as fs from 'fs';
import { compile, TemplateFunction } from 'ejs';

const TMPL_BASE_PATH = path.join(__dirname, 'template');

const templateCache: { [template: string]: TemplateFunction } = {};

export function renderTemplate(templateName: string, params: { [key: string]: any }): string {
  const template: TemplateFunction =
    templateCache[templateName] || (templateCache[templateName] = compileTemplate(templateName));

  return template(params);
}

export function compileTemplate(templateName: string): TemplateFunction {
  return compile(fs.readFileSync(path.join(TMPL_BASE_PATH, templateName), 'utf8'), {
    filename: path.join(TMPL_BASE_PATH, templateName),
  });
}
