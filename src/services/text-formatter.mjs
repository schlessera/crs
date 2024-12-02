export class TextFormatter {
    static cleanLine(line) {
        return line
            .replace(/^[-*•]\s*/, '') // Remove list markers
            .replace(/^[A-Za-z]+:\s*/, '') // Remove any "Label:" patterns
            .replace(/^[\d]+\.\s*/, '') // Remove numbered list markers
            .trim();
    }

    static formatResponse(response, isArray = false) {
        const cleanedResponse = response
            .split('\n')
            .map(line => this.cleanLine(line))
            .filter(line => line.length > 0)
            .join('\n');

        return isArray ? cleanedResponse.split('\n') : cleanedResponse;
    }
} 