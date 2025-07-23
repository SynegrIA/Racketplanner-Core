import * as fs from 'node:fs';
import * as path from 'node:path';
import { globby } from 'globby';
import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';
import generatePkg from '@babel/generator';
import * as t from '@babel/types';
import slugify from 'slugify';

const traverse = traversePkg.default ?? traversePkg;
const generate = generatePkg.default ?? generatePkg;

/* Configura aquí los directorios y atributos a ignorar */
const SRC = 'src';
const OUT_JSON = 'public/locales/es/translation.json';
const IGNORE_ATTRS = ['id', 'className', 'key', 'data-testid', 'data-test', 'href', 'to'];

/* 1️⃣ Recolectamos todos los .js/.jsx/.ts/.tsx */
const files = await globby([`${SRC}/**/*.{js,jsx,ts,tsx}`]);

/* 2️⃣ Diccionario acumulado */
const dict = {};

/* 3️⃣ Función auxiliar para crear claves únicas y legibles */
function makeKey(text) {
    const base = slugify(text.slice(0, 40), { lower: true, strict: true });
    let key = base;
    let i = 1;
    while (dict[key] && dict[key] !== text) key = `${base}_${i++}`;
    return key;
}

/* 4️⃣ Analizamos y reescribimos fichero a fichero */
for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });

    let touched = false; // ¿Hemos cambiado algo?

    traverse(ast, {
        JSXText(path) {
            const raw = path.node.value;
            const text = raw.replace(/\s+/g, ' ').trim();
            if (!text) return;

            const key = makeKey(text);
            dict[key] = text;
            touched = true;

            /* Sustituimos por {t('key')} */
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
            )
                return;

            const text = value.value.trim();
            if (!text) return;

            const key = makeKey(text);
            dict[key] = text;
            touched = true;

            /* Reemplazamos valor por {t('key')} */
            path.node.value = t.jsxExpressionContainer(
                t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
            );
            path.skip();
        },
    });

    if (touched) {
        const output = generate(ast, { quotes: 'single' }).code;
        fs.writeFileSync(file, output);
        console.log(`✔️  Actualizado ${path.relative('.', file)}`);
    }
}

/* 5️⃣ Escribimos (o fusionamos) el JSON de idioma */
const prev = fs.existsSync(OUT_JSON)
    ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'))
    : {};
const merged = { ...prev, ...dict };
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(merged, null, 2));
console.log(`\n🏁  Traducciones guardadas en ${OUT_JSON}`);
