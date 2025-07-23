#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { globby } from 'globby';
import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';
import generatePkg from '@babel/generator';
import * as t from '@babel/types';
import slugifyPkg from 'slugify';

const traverse = traversePkg.default ?? traversePkg;
const generate = generatePkg.default ?? generatePkg;
const slugify = slugifyPkg.default ?? slugifyPkg;

const SRC = 'src';
const OUT_JSON = 'public/locales/es/translation.json';
const IGNORE_ATTRS = ['id', 'className', 'key', 'data-testid', 'data-test', 'href', 'to'];

const files = await globby([`${SRC}/**/*.{js,jsx,ts,tsx}`]);

const dict = Object.create(null);   // ← sin prototipo
function makeKey(text) {
    const base = slugify(text.slice(0, 50), { lower: true, strict: true }) || 'key';
    let key = base;
    let i = 1;
    while (dict[key] && dict[key] !== text) key = `${base}_${i++}`;
    return key;
}

for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

    let touched = false;

    traverse(ast, {
        JSXText(path) {
            const raw = path.node.value;
            const text = raw.replace(/\s+/g, ' ').trim();
            if (!text) return;

            const key = makeKey(text);
            if (!dict[key]) dict[key] = text;     // ← sólo la primera vez
            touched = true;

            path.replaceWith(
                t.jsxExpressionContainer(
                    t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
                )
            );
            path.skip();
        },
        JSXAttribute(path) {
            const { name, value } = path.node;
            if (
                !value ||
                value.type !== 'StringLiteral' ||
                IGNORE_ATTRS.includes(name.name)
            ) return;

            const text = value.value.trim();
            if (!text) return;

            const key = makeKey(text);
            if (!dict[key]) dict[key] = text;
            touched = true;

            path.node.value = t.jsxExpressionContainer(
                t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
            );
            path.skip();
        },
    });

    if (touched) {
        fs.writeFileSync(file, generate(ast, { quotes: 'single' }).code);
        console.log('✔ extraído', path.relative('.', file));
    }
}

/* --- persistir diccionario --- */
const prev = fs.existsSync(OUT_JSON)
    ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'))
    : {};
const merged = { ...prev, ...dict };

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(merged, null, 2) + '\n');

console.log(`\n🏁 ${Object.keys(dict).length} nuevas cadenas → ${OUT_JSON}`);