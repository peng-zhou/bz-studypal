#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Custom script to check for common router usage issues
 * - Checks if router.push() is used without const router = useRouter()
 * - Checks if useRouter is imported but not used
 */

const srcDir = path.join(__dirname, '../src');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  let hasErrors = false;

  // Check if file uses router.push, router.replace, etc.
  const routerUsageRegex = /router\.(push|replace|back|forward|refresh|prefetch)/g;
  const routerUsages = content.match(routerUsageRegex);

  if (routerUsages) {
    // Check if useRouter is imported
    const hasUseRouterImport = content.includes('useRouter') && content.includes("from 'next/navigation'");
    
    if (!hasUseRouterImport) {
      console.error(`❌ ${relativePath}: Uses router methods but missing useRouter import`);
      hasErrors = true;
    } else {
      // Check if router variable is declared (excluding comments)
      const codeWithoutComments = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, ''); // Remove line comments
      const hasRouterDeclaration = codeWithoutComments.includes('const router = useRouter()') || 
                                   codeWithoutComments.includes('const router=useRouter()');
      
      if (!hasRouterDeclaration) {
        console.error(`❌ ${relativePath}: Uses router methods but missing 'const router = useRouter()' declaration`);
        hasErrors = true;
      }
    }
  }

  // Check for unused useRouter import
  const hasUseRouterImport = content.includes('useRouter') && content.includes("from 'next/navigation'");
  if (hasUseRouterImport && !routerUsages) {
    const hasRouterDeclaration = content.includes('const router = useRouter()');
    if (hasRouterDeclaration) {
      console.warn(`⚠️  ${relativePath}: useRouter is imported and declared but never used`);
    }
  }

  return hasErrors;
}

function main() {
  console.log('🔍 Checking router usage patterns...\n');
  
  const pattern = path.join(srcDir, '**/*.{ts,tsx}').replace(/\\/g, '/');
  const files = glob.sync(pattern, {
    ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/node_modules/**']
  });

  let totalErrors = 0;

  files.forEach(file => {
    const hasErrors = checkFile(file);
    if (hasErrors) {
      totalErrors++;
    }
  });

  if (totalErrors > 0) {
    console.error(`\n❌ Found router usage issues in ${totalErrors} file(s)`);
    console.error('Please fix the issues above before committing.\n');
    process.exit(1);
  } else {
    console.log('✅ All router usage patterns look good!\n');
  }
}

// Check if glob is available, if not suggest installation
try {
  require('glob');
  main();
} catch (error) {
  console.log('Installing required dependency: glob');
  const { execSync } = require('child_process');
  try {
    execSync('npm install --save-dev glob', { stdio: 'inherit' });
    main();
  } catch (installError) {
    console.error('Failed to install glob. Please run: npm install --save-dev glob');
    process.exit(1);
  }
}
