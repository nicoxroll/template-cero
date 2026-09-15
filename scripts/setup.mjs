#!/usr/bin/env node
/**
 * scripts/setup.mjs — Asistente interactivo de inicialización para Template Cero.
 *
 * Permite personalizar la marca, datos de contacto, enlaces y colores
 * del proyecto en pocos segundos desde la terminal.
 *
 * Uso:
 *   node scripts/setup.mjs
 *   npm run setup
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.join(rootDir, 'src', 'config', 'site.ts');
const indexPath = path.join(rootDir, 'index.html');

const rl = readline.createInterface({ input, output });

console.log('\n========================================================');
console.log('  ⚡ Template Cero — Asistente de Inicialización');
console.log('========================================================\n');
console.log('Configura tu nuevo proyecto respondiendo unas breves preguntas.');
console.log('(Presiona [ENTER] en cualquier opción para aceptar el valor por defecto)\n');

async function ask(prompt, defaultValue) {
  const answer = await rl.question(`${prompt} [${defaultValue}]: `);
  return answer.trim() ? answer.trim() : defaultValue;
}

async function main() {
  try {
    const name = await ask('1. Nombre de tu empresa o marca', 'Mi Empresa');
    const defaultShort = name.split(' ')[0] || 'Empresa';
    const shortName = await ask('2. Nombre corto o sigla', defaultShort);
    const tagline = await ask(
      '3. Eslogan o propuesta de valor',
      'Soluciones de alto impacto para negocios modernos'
    );
    const description = await ask(
      '4. Descripción breve de la empresa',
      'Plataforma integral y servicios profesionales orientados a la excelencia y los resultados.'
    );

    console.log('\nSelecciona una paleta de color para tu marca:');
    console.log('  1) Emerald (Verde elegante, corporativo, finanzas)');
    console.log('  2) Indigo (Azul moderno, tech, SaaS, digital)');
    console.log('  3) Slate (Escala de grises minimalista, arquitectura, lujo)');
    console.log('  4) Amber (Cálido, creativo, estudio de diseño, energía)');
    const themeChoice = await ask('Opción de tema (1-4)', '1');

    const themeMap = {
      '1': 'emerald',
      '2': 'indigo',
      '3': 'slate',
      '4': 'amber',
    };
    const preset = themeMap[themeChoice] || 'emerald';

    const email = await ask('\n5. Email de contacto', `contacto@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
    const whatsapp = await ask('6. Número de WhatsApp con código de país (solo números)', '5491112345678');
    const address = await ask('7. Dirección u oficinas físicas', 'Av. Principal 1234, Ciudad');

    rl.close();

    console.log('\n⏳ Aplicando configuración a los archivos del proyecto...');

    // 1. Actualizar src/config/site.ts
    let configContent = readFileSync(siteConfigPath, 'utf8');

    configContent = configContent.replace(/name:\s*'[^']*'/, `name: '${name}'`);
    configContent = configContent.replace(/shortName:\s*'[^']*'/, `shortName: '${shortName}'`);
    configContent = configContent.replace(/tagline:\s*'[^']*'/, `tagline: '${tagline}'`);
    configContent = configContent.replace(/description:\s*\n\s*'[^']*'/, `description:\n    '${description}'`);
    configContent = configContent.replace(/preset:\s*'[^']*'/, `preset: '${preset}'`);
    configContent = configContent.replace(/email:\s*'[^']*'/, `email: '${email}'`);
    configContent = configContent.replace(/whatsapp:\s*'[^']*'/, `whatsapp: '${whatsapp}'`);
    configContent = configContent.replace(/address:\s*'[^']*'/, `address: '${address}'`);

    writeFileSync(siteConfigPath, configContent, 'utf8');
    console.log('  ✓ src/config/site.ts actualizado.');

    // 2. Actualizar index.html
    let indexContent = readFileSync(indexPath, 'utf8');
    indexContent = indexContent.replace(
      /<title>[^<]*<\/title>/,
      `<title>${name} — ${tagline}</title>`
    );
    indexContent = indexContent.replace(
      /<meta property="og:site_name" content="[^"]*"/,
      `<meta property="og:site_name" content="${name}"`
    );
    indexContent = indexContent.replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${name} — ${tagline}"`
    );
    writeFileSync(indexPath, indexContent, 'utf8');
    console.log('  ✓ index.html actualizado.');

    console.log('\n========================================================');
    console.log('  🎉 ¡Proyecto configurado exitosamente!');
    console.log('========================================================');
    console.log(`\nMarca: ${name}`);
    console.log(`Tema: ${preset}`);
    console.log(`Email: ${email}`);
    console.log(`WhatsApp: +${whatsapp}`);
    console.log('\nPróximos pasos:');
    console.log('  1. npm run dev       -> Iniciar servidor de desarrollo');
    console.log('  2. Abrir /admin      -> Administrar catálogo, ofertas y contenidos\n');
  } catch (err) {
    console.error('Error durante la configuración:', err);
    rl.close();
    process.exit(1);
  }
}

main();
