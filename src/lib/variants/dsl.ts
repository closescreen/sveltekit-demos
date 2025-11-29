import type { Variant } from "./types"
import { VariantsCollection } from "./variants-collection"

export function parseDSL(input: string): VariantsCollection {
    const lines = input.split(/\r?\n/)
    const variants: Variant[] = []

    let current: Variant | null = null
    const varStartRe = /^\s*=\s*(.+)$/iu        // начало варианта: "= заголовок"

    const plusMinusRe = /^\s*([\+-]+)/
    const costRe = /^\s*[cс]([\+-]+)/iu
    const timeRe = /^\s*[tт]([\+-]+)/iu
    const qualityRe = /^\s*[qkк]([\+-]+)/iu
    const questionRe = /^\s*[cсtтqkк]?\?/iu


    for (const rawLine of lines) {
        const line = rawLine.trimEnd()

        // 1) Начало нового варианта
        const mVar = line.match(varStartRe)
        if (mVar) {
            if (current) {
                variants.push(current)
            }
            current = {
                title: mVar[1].trim(),
                score: 0,
                cost: 0,
                time: 0,
                quality: 0,
                rawLines: [{ text: rawLine, type: 'title', sign: 'unknown' }],
                questions: []
            }
            continue
        }

        // 2) Если варианта ещё нет — пропускаем
        if (!current) {
            continue
        }


        const plusMinusReMatch = line.match(plusMinusRe)
        if (plusMinusReMatch) {
            const countOfPlusOrMinus = plusMinusReMatch[1].length
            const isItPlus = plusMinusReMatch[1].startsWith('+')

            current.score += isItPlus ? countOfPlusOrMinus : -countOfPlusOrMinus

            current.rawLines.push({ text: rawLine, type: 'score', sign: isItPlus ? '+' : '-' })

            continue
        }

        const costReMatch = line.match(costRe)
        if (costReMatch) {
            const countOfPlusOrMinus = costReMatch[1].length
            const isItPlus = costReMatch[1].startsWith('+')

            current.cost += isItPlus ? countOfPlusOrMinus : -countOfPlusOrMinus

            current.rawLines.push({ text: rawLine, type: 'cost', sign: isItPlus ? '+' : '-' })

            continue
        }

        const timeReMatch = line.match(timeRe)
        if (timeReMatch) {
            const countOfPlusOrMinus = timeReMatch[1].length
            const isItPlus = timeReMatch[1].startsWith('+')

            current.time += isItPlus ? countOfPlusOrMinus : -countOfPlusOrMinus

            current.rawLines.push({ text: rawLine, type: 'time', sign: isItPlus ? '+' : '-' })

            continue
        }

        const qualityReMatch = line.match(qualityRe)
        if (qualityReMatch) {
            const countOfPlusOrMinus = qualityReMatch[1].length
            const isItPlus = qualityReMatch[1].startsWith('+')

            current.quality += isItPlus ? countOfPlusOrMinus : -countOfPlusOrMinus

            current.rawLines.push({ text: rawLine, type: 'quality', sign: isItPlus ? '+' : '-' })

            continue
        }

        const questionReMatch = line.match(questionRe)
        if (questionReMatch) {
            current.questions.push(line)

            current.rawLines.push({ text: rawLine, type: 'questions', sign: '+' })

            continue
        }

        // Сохраняем неопознанные в rawLines
        current.rawLines.push({ text: rawLine, type: 'unknown', sign: 'unknown' })

    }

    // Добавляем последний вариант
    if (current) {
        variants.push(current)
    }

    return new VariantsCollection(variants)
}
