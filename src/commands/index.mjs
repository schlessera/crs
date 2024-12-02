export async function handleCommand() {
    try {
        console.error('Command executed successfully');
    } catch (error) {
        console.error('Error executing command:', error.message);
        process.exit(1);
    }
} 