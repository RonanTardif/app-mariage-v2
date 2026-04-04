#!/usr/bin/env node
/**
 * Mélange aléatoirement l'ordre des réponses dans quiz.json
 * et met à jour answer_index en conséquence.
 *
 * Usage : node scripts/shuffle-quiz.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FILE = path.join(__dirname, '../public/data/quiz.json')

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const raw = fs.readFileSync(FILE, 'utf-8')
const data = JSON.parse(raw)

data.questions = data.questions.map((q) => {
  const correct = q.options[q.answer_index]
  const shuffled = shuffle(q.options)
  return {
    ...q,
    options: shuffled,
    answer_index: shuffled.indexOf(correct),
  }
})

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
console.log(`✓ ${data.questions.length} questions mélangées → ${FILE}`)
