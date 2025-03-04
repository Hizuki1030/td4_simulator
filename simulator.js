/**
 * TD4 Simulator UI Implementation
 * 
 * This file handles the user interface for the TD4 simulator, including:
 * - Displaying register values
 * - Visualizing memory
 * - Handling user input
 * - Controlling execution
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the TD4 processor
    const td4 = new TD4();
    
    // UI elements
    const registerAElement = document.getElementById('register-a');
    const registerBElement = document.getElementById('register-b');
    const programCounterElement = document.getElementById('program-counter');
    const outputElement = document.getElementById('output');
    const memoryContainer = document.getElementById('memory-container');
    const programInput = document.getElementById('program-input');
    
    // Control buttons
    const stepButton = document.getElementById('step-btn');
    const runButton = document.getElementById('run-btn');
    const resetButton = document.getElementById('reset-btn');
    const loadProgramButton = document.getElementById('load-program');
    const speedControl = document.getElementById('speed');
    
    // Execution state
    let executionInterval = null;
    
    // Initialize memory display
    initializeMemoryDisplay();
    
    // Update UI with initial state
    updateUI();
    
    // Event listeners
    stepButton.addEventListener('click', handleStepExecution);
    runButton.addEventListener('click', handleRunExecution);
    resetButton.addEventListener('click', handleReset);
    loadProgramButton.addEventListener('click', handleLoadProgram);
    
    /**
     * Initialize the memory display
     */
    function initializeMemoryDisplay() {
        memoryContainer.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const memoryCell = document.createElement('div');
            memoryCell.className = 'memory-cell';
            memoryCell.id = `memory-${i}`;
            
            const addressElement = document.createElement('span');
            addressElement.className = 'memory-address';
            addressElement.textContent = i.toString(16).toUpperCase();
            
            const valueElement = document.createElement('span');
            valueElement.className = 'memory-value';
            valueElement.textContent = '00000000';
            
            memoryCell.appendChild(addressElement);
            memoryCell.appendChild(valueElement);
            memoryContainer.appendChild(memoryCell);
        }
    }
    
    /**
     * Update the UI to reflect the current processor state
     */
    function updateUI() {
        const state = td4.getState();
        
        // Update registers
        registerAElement.textContent = TD4.decimalToBinary4bit(state.registerA);
        registerBElement.textContent = TD4.decimalToBinary4bit(state.registerB);
        programCounterElement.textContent = TD4.decimalToBinary4bit(state.programCounter);
        outputElement.textContent = TD4.decimalToBinary4bit(state.output);
        
        // Update memory display
        for (let i = 0; i < 16; i++) {
            const memoryCell = document.getElementById(`memory-${i}`);
            const valueElement = memoryCell.querySelector('.memory-value');
            valueElement.textContent = TD4.decimalToBinary8bit(state.memory[i]);
            
            // Highlight the current instruction
            if (i === state.programCounter) {
                memoryCell.classList.add('active');
            } else {
                memoryCell.classList.remove('active');
            }
        }
        
        // Update button states
        runButton.textContent = state.running ? '停止' : '実行';
        stepButton.disabled = state.running || state.halted;
        
        // If halted, stop execution
        if (state.halted && state.running) {
            stopExecution();
        }
    }
    
    /**
     * Handle step execution
     */
    function handleStepExecution() {
        td4.step();
        updateUI();
    }
    
    /**
     * Handle run/stop execution
     */
    function handleRunExecution() {
        const state = td4.getState();
        
        if (state.running) {
            stopExecution();
        } else {
            startExecution();
        }
    }
    
    /**
     * Start continuous execution
     */
    function startExecution() {
        if (td4.getState().halted) {
            return;
        }
        
        td4.running = true;
        updateUI();
        
        // Calculate execution speed (instructions per second)
        const speed = parseInt(speedControl.value);
        const interval = 1000 / speed;
        
        // Start execution loop
        executionInterval = setInterval(() => {
            const shouldContinue = td4.step();
            updateUI();
            
            if (!shouldContinue) {
                stopExecution();
            }
        }, interval);
    }
    
    /**
     * Stop execution
     */
    function stopExecution() {
        if (executionInterval) {
            clearInterval(executionInterval);
            executionInterval = null;
        }
        
        td4.running = false;
        updateUI();
    }
    
    /**
     * Handle reset
     */
    function handleReset() {
        stopExecution();
        td4.reset();
        updateUI();
    }
    
    /**
     * Handle loading a program
     */
    function handleLoadProgram() {
        try {
            // Parse the program from the text input
            const programText = programInput.value;
            const program = TD4.parseProgram(programText);
            
            // Load the program into the processor
            td4.loadProgram(program);
            
            // Update UI
            updateUI();
            
            // Show success message
            alert('プログラムが正常にロードされました。');
        } catch (error) {
            // Show error message
            alert(`エラー: ${error.message}`);
        }
    }
    
    // Add some example programs to help users get started
    const examplePrograms = {
        counter: `// カウンターの例
// レジスタAを1ずつ増やし、出力する
0011 0000  // MOV A, 0
0100 0000  // MOV B, A
1001 0000  // OUT B
0000 0001  // ADD A, 1
1111 0001  // JMP 1`,

        blink: `// 点滅の例
// 出力を交互に0と15に切り替える
0011 0000  // MOV A, 0
1011 0000  // OUT 0
0011 1111  // MOV A, 15
1011 1111  // OUT 15
1111 0000  // JMP 0`,

        fibonacci: `// フィボナッチ数列の例
// A=現在の数、B=前の数
0011 0001  // MOV A, 1
0100 0000  // MOV B, A
1001 0000  // OUT B
0001 0000  // MOV A, B
0000 0001  // ADD A, 1
0100 0000  // MOV B, A
1001 0000  // OUT B
1111 0010  // JMP 2`
    };
    
    // Add example program buttons
    const programInputSection = document.querySelector('.program-input');
    const examplesDiv = document.createElement('div');
    examplesDiv.className = 'examples';
    examplesDiv.innerHTML = '<h3>サンプルプログラム:</h3>';
    
    for (const [name, program] of Object.entries(examplePrograms)) {
        const button = document.createElement('button');
        button.textContent = name === 'counter' ? 'カウンター' : 
                            name === 'blink' ? '点滅' : 
                            'フィボナッチ';
        button.className = 'example-btn';
        button.addEventListener('click', () => {
            programInput.value = program;
        });
        examplesDiv.appendChild(button);
    }
    
    programInputSection.insertBefore(examplesDiv, loadProgramButton);
    
    // Add some styling for example buttons
    const style = document.createElement('style');
    style.textContent = `
        .examples {
            margin: 10px 0;
        }
        .example-btn {
            margin-right: 5px;
            background-color: #673AB7;
        }
        .example-btn:hover {
            background-color: #5E35B1;
        }
    `;
    document.head.appendChild(style);
    
    // Load the counter example by default
    programInput.value = examplePrograms.counter;
});
