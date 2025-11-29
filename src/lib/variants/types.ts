export type Line = {
    text: string
    type: 'title' | 'score' | 'cost' | 'time' | 'quality' | 'questions' | 'unknown'
    sign: '+' | '-' | 'unknown'
}

export type Variant = {
    rawLines: Line[]     // все строки блока
    title: string
    score: number
    cost: number
    time: number
    quality: number
    questions: string[]    // тексты нерешённых вопросов
}

export type Comparator<T> = (a: T, b: T) => number