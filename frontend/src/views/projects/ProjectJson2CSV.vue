<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()

defineProps<{
  isDark: boolean
}>()
</script>

<template>
    <div class="max-w-3xl mx-auto w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <h1 class="text-3xl font-bold text-primary dark:text-blue-400 text-center mt-0 mb-2">{{ t("Json2CSV") }}</h1>
        <p class="text-center text-slate-500 dark:text-gray-400 mb-8">{{ t("Json2CSVText") }}</p>

        <section class="mb-8">
            <div class="flex justify-between items-center mb-2">
                <label for="jsonInput" class="cursor-pointer">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ t("inputData") }}</h2>
                </label>
                <input 
                    type="file" 
                    id="fileInput" 
                    accept=".json,.csv"
                    class="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-custom file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 transition-all"
                >
            </div>
            <textarea 
                id="jsonInput" 
                placeholder="Paste JSON or CSV data here..."
                class="w-full h-52 p-4 border border-gray-200 dark:border-gray-700 rounded-custom font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            ></textarea>        
        </section>

        <section class="flex flex-col sm:flex-row gap-4 justify-center my-8">
            <button id="convertToCSVButton" class="px-5 py-2.5 rounded-custom bg-primary hover:bg-primary-hover text-white font-medium transition-all shadow-sm active:transform active:scale-95">↓ {{ t("ConvertToCSV") }} ↓</button>
            <button id="convertToJsonButton" class="px-5 py-2.5 rounded-custom bg-primary hover:bg-primary-hover text-white font-medium transition-all shadow-sm active:transform active:scale-95">↓ {{ t("ConvertToJSON") }} ↓</button>
        </section>

        <section class="mb-8">
            <label for="outputArea" class="cursor-pointer">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{{ t("output") }}</h2>
            </label>
            <textarea 
                id="outputArea" 
                placeholder="Result will appear here..." 
                readonly
                class="w-full h-52 p-4 border border-gray-200 dark:border-gray-700 rounded-custom font-mono text-sm resize-y bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 focus:outline-none cursor-not-allowed"
            ></textarea>
            <div class="flex gap-2 mt-4 flex-wrap">
                <button id="copyButton" class="px-4 py-2 rounded-custom border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">{{ t("copytoClipboard") }}</button>
                <button id="downloadButton" class="px-4 py-2 rounded-custom border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">{{ t("DownloadFile") }}</button>
                <button id="clearButton" class="px-4 py-2 rounded-custom border border-transparent text-danger dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-danger transition-all">{{ t("clearall") }}</button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
// DOM Elements
const jsonInput = document.getElementById('jsonInput') as HTMLTextAreaElement;
const outputArea = document.getElementById('outputArea') as HTMLTextAreaElement;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const convertToCSVButton = document.getElementById('convertToCSVButton') as HTMLButtonElement;
const convertToJsonButton = document.getElementById('convertToJsonButton') as HTMLButtonElement;
const downloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
const copyButton = document.getElementById('copyButton') as HTMLButtonElement;


/**
 * Converts JSON array of objects to CSV string
 */
function jsonToCSV(json: any[]): string {
    if (json.length === 0) return "";
    
    const headers = Object.keys(json[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of json) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + val).replace(/"/g, '""'); // Escape double quotes
            return `"${escaped}"`; // Wrap in quotes to handle commas
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

/**
 * Converts CSV string to JSON array of objects
 */
function csvToJSON(csv: string): any[] {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/^"|"$/g, '')) ?? [];
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const currentline = lines[i]?.split(',').map(v => v.trim().replace(/^"|"$/g, '')) ?? [];
        
        headers.forEach((header, index) => {
            obj[header] = currentline[index];
        });
        
        result.push(obj);
    }
    
    return result;
}

// --- Event Handlers ---

convertToCSVButton.addEventListener('click', () => {
    try {
        const input = jsonInput.value.trim();
        if (!input) return;
        
        const json = JSON.parse(input);
        const data = Array.isArray(json) ? json : [json];
        outputArea.value = jsonToCSV(data);
    } catch (error) {
        alert("Invalid JSON format. Please check your input.");
        console.error(error);
    }
});

convertToJsonButton.addEventListener('click', () => {
    try {
        const input = jsonInput.value.trim();
        if (!input) return;
        
        const json = csvToJSON(input);
        outputArea.value = JSON.stringify(json, null, 4);
    } catch (error) {
        alert("Error parsing CSV. Please check your data.");
        console.error(error);
    }
});

clearButton.addEventListener('click', () => {
    jsonInput.value = "";
    outputArea.value = "";
    fileInput.value = "";
});

copyButton.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value)
        .then(() => alert("Copied to clipboard!"))
        .catch(err => console.error('Could not copy text: ', err));
});

downloadButton.addEventListener('click', () => {
    const content = outputArea.value;
    if (!content) return;
    
    const isJson = content.trim().startsWith('[') || content.trim().startsWith('{');
    const blob = new Blob([content], { type: isJson ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = isJson ? 'converted_data.json' : 'converted_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        jsonInput.value = event.target?.result as string;
    };
    reader.readAsText(file);
});

</script>