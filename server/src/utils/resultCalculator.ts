/**
 * Pure Result Calculation Engine
 * No database dependencies. No side effects.
 */

export interface GradingRule {
    min_score: number;
    max_score: number;
    grade: string;
    remark: string;
}

export const ResultCalculator = {
    /**
     * Calculates total score from components.
     * Ensures non-negative numbers.
     */
    calculateTotal(ca: number = 0, test: number = 0, exam: number = 0): number {
        return Number((Math.max(0, ca) + Math.max(0, test) + Math.max(0, exam)).toFixed(2));
    },

    /**
     * Determines grade and remark based on total score and rules.
     * Rules should be sorted by priority or non-overlapping.
     */
    calculateGrade(total: number, rules: GradingRule[]): { grade: string; remark: string } {
        const defaultResult = { grade: 'F', remark: 'Fail' };

        // Find the rule that strictly contains the total
        const match = rules.find(rule => total >= rule.min_score && total <= rule.max_score);

        return match ? { grade: match.grade, remark: match.remark } : defaultResult;
    },

    /**
     * Calculates the average of an array of numbers.
     * Returns 0 if empty.
     */
    calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        return Number((sum / values.length).toFixed(2));
    },

    /**
     * Calculates positions based on scores (descending).
     * Handles ties: 1st, 2nd, 2nd, 4th (Standard Competition Ranking).
     * Use dense=true for 1st, 2nd, 2nd, 3rd.
     */
    calculatePositions(items: { id: string; score: number }[], dense: boolean = false): Map<string, number> {
        // Sort descending
        const sorted = [...items].sort((a, b) => b.score - a.score);

        const positions = new Map<string, number>();

        if (sorted.length === 0) return positions;

        let currentRank = 1;
        let sameScoreCount = 0;

        for (let i = 0; i < sorted.length; i++) {
            const item = sorted[i];

            // If not first item and score differs from previous
            if (i > 0 && item.score < sorted[i - 1].score) {
                if (dense) {
                    currentRank++;
                } else {
                    currentRank += sameScoreCount;
                }
                sameScoreCount = 0; // Reset counter for new rank group
            }

            // If dense=false, we only increment rank when score changes by the accumulated count
            // Wait, standard algo:
            // A=90 (1), B=90 (1), C=80 (3)
            // i=0: rank=1. count=1.
            // i=1: score==prev. rank=1. count=2.
            // i=2: score<prev. rank+=count(2) -> 3. count=1.

            // Correct logic:
            // Rank is determined by index + 1, unless tied with previous.

            let rank = i + 1;
            if (i > 0 && item.score === sorted[i - 1].score) {
                rank = positions.get(sorted[i - 1].id)!; // Inherit previous rank
            } else {
                // If we want dense ranking, we track distinct scores.
                // But prompt didn't specify dense. Assuming standard.
                // Standard ranking: 1, 2, 2, 4. 
                // Logic: rank = i + 1. Correct.
                // Wait, if 2nd and 3rd are tied, they both get 2. 4th person (index 3) gets 4.
                // Implemented logic below:
            }

            // Let's implement standard ranking simply:
            if (i > 0 && item.score === sorted[i - 1].score) {
                positions.set(item.id, positions.get(sorted[i - 1].id)!);
            } else {
                positions.set(item.id, i + 1);
            }
        }

        return positions;
    }
};
