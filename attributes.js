document.addEventListener('DOMContentLoaded', () => {
    function parseFunctionalDependencies(fdString) {
        const lines = fdString.split('\n').filter(line => line.trim());
        return lines.map(line => {
            const [left, right] = line.split('->').map(side => side.trim());
            if (!left || !right) throw new Error(`Invalid FD: "${line}"`);
            return {
                left: left.split(',').map(attr => attr.trim()).filter(Boolean),
                right: right.split(',').map(attr => attr.trim()).filter(Boolean)
            };
        });
    }

    function getClosure(attrSet, fds) {
        const closure = new Set(attrSet);
        let changed = true;

        while (changed) {
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
        }

        return closure;
    }

    function isSuperkey(attrSet, fds, allAttributes) {
        const closure = getClosure(attrSet, fds);
        return allAttributes.every(attr => closure.has(attr));
    }

    function arraysEqual(a, b) {
        return a.length === b.length && a.every(val => b.includes(val));
    }

    function findCandidateKeys(attributes, fds) {
        const candidateKeys = [];
        const queue = [[]];

        while (queue.length > 0) {
            const current = queue.shift();

            // Avoid duplicates
            if (candidateKeys.some(ck => arraysEqual(ck.sort(), current.slice().sort()))) {
                continue;
            }

            if (isSuperkey(current, fds, attributes)) {
                // Check minimality
                if (!candidateKeys.some(key => key.every(k => current.includes(k)))) {
                    candidateKeys.push(current);
                }
            } else {
                for (const attr of attributes) {
                    if (!current.includes(attr)) {
                        queue.push([...current, attr]);
                    }
                }
            }
        }

        return candidateKeys;
    }

    function findSuperkeys(attributes, fds, candidateKeys) {
        const superkeys = [];
        const queue = [[]];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            const keyStr = current.slice().sort().join(',');

            if (visited.has(keyStr)) continue;
            visited.add(keyStr);

            if (isSuperkey(current, fds, attributes)) {
                const isCandidate = candidateKeys.some(key =>
                    arraysEqual(key.sort(), current.slice().sort())
                );
                if (!isCandidate) {
                    superkeys.push(current);
                }
            } else {
                for (const attr of attributes) {
                    if (!current.includes(attr)) {
                        queue.push([...current, attr]);
                    }
                }
            }
        }

        return superkeys;
    }

    function findPrimeAttributes(attributes, candidateKeys) {
        const prime = new Set(candidateKeys.flat());
        const nonPrime = attributes.filter(attr => !prime.has(attr));
        return {
            prime: Array.from(prime),
            nonPrime: nonPrime
        };
    }

    document.getElementById('attributeForm').addEventListener('submit', function (e) {
        e.preventDefault();
        try {
            const attributes = document.getElementById('attributes').value
                .split(',').map(attr => attr.trim()).filter(Boolean);

            const fdString = document.getElementById('functionalDependencies').value;
            const fds = parseFunctionalDependencies(fdString);

            const candidateKeys = findCandidateKeys(attributes, fds);
            const superkeys = findSuperkeys(attributes, fds, candidateKeys);
            const { prime, nonPrime } = findPrimeAttributes(attributes, candidateKeys);

            document.getElementById('candidateKeys').innerHTML = candidateKeys.length
                ? candidateKeys.map(key => `<p>{${key.join(', ')}}</p>`).join('')
                : '<p>None</p>';

            document.getElementById('superkeys').innerHTML = superkeys.length
                ? superkeys.map(key => `<p>{${key.join(', ')}}</p>`).join('')
                : '<p>None</p>';

            document.getElementById('primeAttributes').innerHTML =
                `<p>{${prime.join(', ') || 'None'}}</p>`;

            document.getElementById('nonPrimeAttributes').innerHTML =
                `<p>{${nonPrime.join(', ') || 'None'}}</p>`;

            document.getElementById('results').style.display = 'block';

        } catch (err) {
            alert(err.message);
            console.error("Error in attribute analysis:", err);
        }
    });
});
