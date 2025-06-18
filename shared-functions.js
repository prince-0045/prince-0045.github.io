// Shared functions for database normalization tools

// Function to find closure of a set of attributes
function findClosure(attributes, fds) {
    if (!Array.isArray(attributes) || !Array.isArray(fds)) {
        throw new Error('Invalid input: attributes and fds must be arrays');
    }
    
    let closure = new Set(attributes);
    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = 1000;

    while (changed && iterations < MAX_ITERATIONS) {
        changed = false;
        for (const fd of fds) {
            if (fd.left.every(attr => closure.has(attr))) {
                for (const attr of fd.right) {
                    if (!closure.has(attr)) {
                        closure.add(attr);
                        changed = true;
                    }
                }
            }
        }
        iterations++;
    }

    if (iterations >= MAX_ITERATIONS) {
        console.warn('Closure computation reached maximum iterations');
    }

    return Array.from(closure);
}

// Function to parse functional dependencies
function parseFunctionalDependencies(fdString) {
    try {
        const lines = fdString.split('\n').filter(line => line.trim());
        return lines.map(line => {
            if (!line.includes('->')) {
                throw new Error(`Invalid FD format: ${line}. Must contain '->'`);
            }
            const [left, right] = line.split('->').map(side => 
                side.trim().split(',').map(attr => attr.trim()).filter(attr => attr)
            );
            if (left.length === 0 || right.length === 0) {
                throw new Error(`Invalid FD: ${line}. Both sides must have attributes`);
            }
            return { left, right };
        });
    } catch (error) {
        console.error('Error parsing FDs:', error);
        throw error;
    }
}

// Helper function to format a single FD
function formatFD(fd) {
    return `{${fd.left.join(', ')}} → {${fd.right.join(', ')}}`;
}

// Helper function to format multiple FDs
function formatFDs(fds) {
    return fds.map(formatFD).join(', ');
} 