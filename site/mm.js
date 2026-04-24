async function fetchCategories() {
    const response = await fetch('/categories');
    return await response.json();
}

async function loadTheorems() {
    const categories = await fetchCategories();
    const theoremsDiv = document.getElementById('theorems');

    for (const cat of categories) {
        const details = document.createElement('details');
        details.className = 'category';

        const summary = document.createElement('summary');
        summary.textContent = cat;
        details.appendChild(summary);

        const div = document.createElement('div');
        div.id = `cat-${cat}`;
        details.appendChild(div);
        theoremsDiv.appendChild(details);

        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        document.getElementById('proofCategory').appendChild(option);

        const response = await fetch(`/proofs/${cat}.mm1`);
        const text = await response.text();
        const items = parseItems(text);
        const html = items.map(item => `<div class="theorem">${highlightTheorem(item.content)}</div>`).join('');
        div.innerHTML = html
    }
}

function highlightTheorem(text) {
    return text
        .replace(/\n/g, '<br>')
        .replace(/\b(theorem|axiom|term|prefix|infix(r|l)|prec)\b/g, '<span class="mm-theorem">$1</span>')
        .replace(/\$([^$]+)\$/g, '<span class="mm-type">$&</span>')
        .replace(/\b(wff)\b/g, '<span class="mm-wff">$1</span>')
        .replace(/<br>    =/g, '\n<br>    <span class="mm-equal">=</span>')
        .replace(/'(\(.+\))/g, '\'<span class="mm-proof">$1</span>');
}

function parseItems(text) {
    const lines = text.split('\n');
    const items = [];
    let current = '';
    let type = '';
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('theorem') || trimmed.startsWith('axiom') || trimmed.startsWith('term')) {
            if (current) items.push({type, content: current.trim()});
            type = trimmed.split(' ')[0];
            current = line;
        } else if (current) {
            current += '\n' + line;
            if (trimmed.endsWith(';')) {
                items.push({type, content: current.trim()});
                current = '';
                type = '';
            }
        }
    }
    if (current) items.push({type, content: current.trim()});
    return items;
}

window.onload = loadTheorems;

function addCategory() {
    document.getElementById('addCategoryForm').style.display = 'block';
    document.getElementById('newCategoryName').value = '';
}

function createCategory() {
    const name = document.getElementById('newCategoryName').value;
    fetchCategories().then(categories => {
        const lastCat = categories[categories.length - 1];
        const code = `import "${lastCat}.mm1";\n\n-------- NEW CATEGORY --------\n\n-- ${name} --\n`;
        fetch('/add-category', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, code})
        }).then(() => {
            alert('Category added!');
            location.reload();
        });
    });
}

function addProof() {
    document.getElementById('addProofForm').style.display = 'block';
    document.getElementById('theoremName').value = '';
    document.getElementById('numWffs').value = '';
    document.getElementById('numHyps').value = '';
    document.getElementById('conclusion').value = '';
    document.getElementById('proof').value = '';
    document.getElementById('wffNames').innerHTML = '';
    document.getElementById('hypInputs').innerHTML = '';
}

const wff_names = ['p', 's', 'c', 'h', 't', 'e', 'z', 'g', 'r', 'm', 'l', 'k'];
var wff_inputs_generated = false;
function generateWffInputs() {
    const num = document.getElementById('numWffs').value;
    let html = '';
    for (let i = 0; i < num; i++) {
        html += `Wff ${i+1}: <input type="text" value="${wff_names[i] || 'x'}" id="wff${i}"><br>`;
    }
    document.getElementById('wffNames').innerHTML = html;

    wff_inputs_generated = true;
}

function generateHypInputs() {
    const num = document.getElementById('numHyps').value;
    let html = '';
    for (let i = 0; i < num; i++) {
        html += `Hyp ${i+1} Name: <input type="text" id="hypName${i}" value="${document.getElementById('theoremName').value || 'x'}_${i+1}"><br>`;
        html += `Hyp ${i+1} Type: <input type="text" id="hypType${i}" class="code-font" placeholder="p"><br>`;
    }
    document.getElementById('hypInputs').innerHTML = html;
}

function generateTheorem() {
    const category = document.getElementById('proofCategory').value;
    const name = document.getElementById('theoremName').value;

    const numWffs = document.getElementById('numWffs').value;
    let wffs = wff_names.slice(0, numWffs);
    if (wff_inputs_generated) {
        wffs = [];
        for (let i = 0; i < numWffs; i++) {
            wffs.push(document.getElementById(`wff${i}`).value);
        }
    }

    const numHyps = document.getElementById('numHyps').value;
    const hyps = [];
    for (let i = 0; i < numHyps; i++) {
        const hname = document.getElementById(`hypName${i}`).value;
        const htype = document.getElementById(`hypType${i}`).value;
        hyps.push(` (${hname}: $ ${htype} $)`);
    }

    const conclusion = document.getElementById('conclusion').value;

    let proof = document.getElementById('proof').value.trim();
    if (proof.includes(' ')) {
        proof = `(${proof})`;
    }

    for (let i = 0; i < hyps.length; i++) {
        const hypName = document.getElementById(`hypName${i}`).value;
        proof = proof.replace(new RegExp(`\\$${i + 1}`, 'g'), hypName);
    }

    const theorem = `theorem ${name}(${wffs.join(' ')}: wff)${hyps.join('')}: $ ${conclusion} $\n    = '${proof};`;
    fetch('/add-theorem', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({category, code: theorem})
    }).then(() => {
        alert('Theorem added!');
        location.reload();
    });
}
