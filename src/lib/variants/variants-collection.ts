import type { Variant, Comparator } from "./types"

export class VariantsCollection {
    private variants: Variant[]
    private comps: Comparator<Variant>[] = []

    constructor(variants: Variant[]) {
        this.variants = variants
    }

    /** Накопить один критерий сортировки */
    orderBy(key: (v: Variant) => number, order: 'asc' | 'desc' = 'asc'): this {
        this.comps.push((a, b) => {
            const va = key(a), vb = key(b)
            if (va === vb) return 0
            // если desc = false — меньшие идёт раньше: (va < vb ? -1 : +1)
            // если desc = true  — большие идёт раньше: (va < vb ? +1 : -1)
            return (va < vb ? -1 : 1) * (order == 'asc' ? 1 : -1)
        })
        return this
    }

    /** Отдать массив, применяя все накопленные компараторы */
    toArray(): Variant[] {
        if (this.comps.length === 0) {
            return [...this.variants]
        }
        return [...this.variants].sort((a, b) => {
            for (const cmp of this.comps) {
                const r = cmp(a, b)
                if (r !== 0) return r
            }
            return 0
        })
    }

    /** Собрать обратно в DSL-текст */
    toDSL(): string {
        return this.toArray()
            .map(v => v.rawLines.join("\n"))
            .join("\n\n")
    }
}
