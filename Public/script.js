// Global variables
let currentStep = 1;
let selectedBusinessType = '';
let nicheKeywords = '';
let selectedProducts = [];
let allProducts = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('End to End Manager initialized with real data!');
    
    document.getElementById('niche-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            goToStep2();
        }
    });
});

// Utility functions
function fillNiche(niche) {
    document.getElementById('niche-input').value = niche;
    document.getElementById('niche-input').focus();
}

function goToStep2() {
    const nicheInput = document.getElementById('niche-input').value.trim();
    
    if (!nicheInput) {
        alert('
