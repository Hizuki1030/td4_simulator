/**
 * TD4 (Toy Digital 4-bit) Processor Implementation
 * 
 * This file contains the core logic for the TD4 processor, including:
 * - Register management (A, B, PC)
 * - Memory operations
 * - Instruction execution
 * - Carry flag handling
 */

class TD4 {
    constructor() {
        this.reset();
    }

    /**
     * Reset the processor to its initial state
     */
    reset() {
        // Registers (4-bit)
        this.registerA = 0;
        this.registerB = 0;
        this.programCounter = 0;
        
        // Output port (4-bit)
        this.output = 0;
        
        // Carry flag
        this.carryFlag = 0;
        
        // Memory (16 bytes, each instruction is 8 bits)
        this.memory = new Array(16).fill(0);
        
        // Execution state
        this.running = false;
        this.halted = false;
    }

    /**
     * Load a program into memory
     * @param {Array} program - Array of 8-bit instructions
     */
    loadProgram(program) {
        // Reset the processor
        this.reset();
        
        // Load program into memory (up to 16 instructions)
        for (let i = 0; i < Math.min(program.length, 16); i++) {
            this.memory[i] = program[i];
        }
    }

    /**
     * Execute a single instruction
     * @returns {boolean} - True if execution should continue, false if halted
     */
    step() {
        if (this.halted) {
            return false;
        }

        // Fetch instruction from memory
        const instruction = this.memory[this.programCounter];
        
        // Increment program counter (wraps around at 16)
        this.programCounter = (this.programCounter + 1) & 0xF;
        
        // Decode and execute instruction
        this.executeInstruction(instruction);
        
        return !this.halted;
    }

    /**
     * Execute a specific instruction
     * @param {number} instruction - 8-bit instruction
     */
    executeInstruction(instruction) {
        // Extract opcode (upper 4 bits) and immediate value (lower 4 bits)
        const opcode = (instruction >> 4) & 0xF;
        const immediate = instruction & 0xF;

        // Execute based on opcode
        switch (opcode) {
            case 0x0: // ADD A, Im
                this.addToRegisterA(immediate);
                break;
                
            case 0x1: // MOV A, B
                this.registerA = this.registerB;
                break;
                
            case 0x2: // IN A
                // In a real TD4, this would read from input ports
                // For simulation, we'll just use the immediate value
                this.registerA = immediate;
                break;
                
            case 0x3: // MOV A, Im
                this.registerA = immediate;
                break;
                
            case 0x4: // MOV B, A
                this.registerB = this.registerA;
                break;
                
            case 0x5: // ADD B, Im
                this.addToRegisterB(immediate);
                break;
                
            case 0x6: // IN B
                // In a real TD4, this would read from input ports
                // For simulation, we'll just use the immediate value
                this.registerB = immediate;
                break;
                
            case 0x7: // MOV B, Im
                this.registerB = immediate;
                break;
                
            case 0x9: // OUT B
                this.output = this.registerB;
                break;
                
            case 0xB: // OUT Im
                this.output = immediate;
                break;
                
            case 0xE: // JNC Im
                if (this.carryFlag === 0) {
                    this.programCounter = immediate;
                }
                break;
                
            case 0xF: // JMP Im
                this.programCounter = immediate;
                break;
                
            default:
                // Unimplemented or invalid opcode
                // In a real processor, this might trigger an exception
                // For simulation, we'll just halt
                this.halted = true;
                break;
        }
        
        // Ensure registers stay 4-bit
        this.registerA &= 0xF;
        this.registerB &= 0xF;
        this.programCounter &= 0xF;
        this.output &= 0xF;
    }

    /**
     * Add a value to register A, setting carry flag if needed
     * @param {number} value - Value to add (4-bit)
     */
    addToRegisterA(value) {
        const result = this.registerA + value;
        this.registerA = result & 0xF;
        this.carryFlag = (result > 0xF) ? 1 : 0;
    }

    /**
     * Add a value to register B, setting carry flag if needed
     * @param {number} value - Value to add (4-bit)
     */
    addToRegisterB(value) {
        const result = this.registerB + value;
        this.registerB = result & 0xF;
        this.carryFlag = (result > 0xF) ? 1 : 0;
    }

    /**
     * Get the current state of the processor
     * @returns {Object} - Current state
     */
    getState() {
        return {
            registerA: this.registerA,
            registerB: this.registerB,
            programCounter: this.programCounter,
            output: this.output,
            carryFlag: this.carryFlag,
            memory: [...this.memory],
            running: this.running,
            halted: this.halted
        };
    }

    /**
     * Convert a binary string to a number
     * @param {string} binary - Binary string (e.g., "1010")
     * @returns {number} - Decimal value
     */
    static binaryToDecimal(binary) {
        return parseInt(binary, 2);
    }

    /**
     * Convert a number to a 4-bit binary string
     * @param {number} value - Decimal value
     * @returns {string} - 4-bit binary string
     */
    static decimalToBinary4bit(value) {
        return (value & 0xF).toString(2).padStart(4, '0');
    }

    /**
     * Convert a number to an 8-bit binary string
     * @param {number} value - Decimal value
     * @returns {string} - 8-bit binary string
     */
    static decimalToBinary8bit(value) {
        return (value & 0xFF).toString(2).padStart(8, '0');
    }

    /**
     * Parse a program from text format (each line is one instruction)
     * @param {string} programText - Program in text format
     * @returns {Array} - Array of 8-bit instructions
     */
    static parseProgram(programText) {
        const lines = programText.trim().split('\n');
        const program = [];
        
        for (const line of lines) {
            // Skip empty lines and comments
            const trimmedLine = line.trim();
            if (trimmedLine === '' || trimmedLine.startsWith('//')) {
                continue;
            }
            
            // Remove inline comments
            let instructionPart = trimmedLine;
            if (instructionPart.includes('//')) {
                instructionPart = instructionPart.split('//')[0].trim();
            }
            
            // Remove any spaces and convert to a number
            const binaryString = instructionPart.replace(/\s/g, '');
            if (binaryString.length !== 8 || !/^[01]+$/.test(binaryString)) {
                throw new Error(`Invalid instruction: ${instructionPart}`);
            }
            
            program.push(parseInt(binaryString, 2));
        }
        
        return program;
    }
}
