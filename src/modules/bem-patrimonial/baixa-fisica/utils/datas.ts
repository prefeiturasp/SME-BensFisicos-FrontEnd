// Helpers de data (horário local). Ficam fora das páginas para serem
// unitariamente testáveis e entrarem no relatório de cobertura.

export function isDataFutura(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d > today
}
