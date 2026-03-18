import { fetchJson } from './http'

const BASE = import.meta.env.BASE_URL

export async function getPlaces() {
  return fetchJson(BASE + 'data/places.json')
}

export async function getQuiz() {
  return fetchJson(BASE + 'data/quiz.json')
}

export async function getRooms() {
  return fetchJson(BASE + 'data/rooms.json')
}
