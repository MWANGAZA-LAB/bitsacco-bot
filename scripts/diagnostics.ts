#!/usr/bin/env node

/**
 * Project Diagnostics and Cleanup Script
 * Bitsacco WhatsApp Assistant - Comprehensive dependency and code cleanup
 * TypeScript version with enhanced type safety
 * 
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

interface DuplicateFile {
  original: string;
  duplicate: string;
  size: number;
}

interface UnusedImport {
  file: string;
  import: string;
  line: number;
}

interface ImportInfo {
  name: string;
  line: number;
  type: 'named' | 'default';
}

interface DiagnosticsReport {
  timestamp: string;
  issues: string[];
  fixes: string[];
  warnings: string[];
  summary: {
    nodeVersion?: string;
    npmVersion?: string;
    totalDependencies?: number;
    duplicateFiles?: number;
    unusedImports?: number;
  };
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: any;
}

interface AuditResult {
  vulnerabilities?: Record<string, any>;
  [key: string]: any;
}

const DIAGNOSTICS_REPORT: DiagnosticsReport = {
  timestamp: new Date().toISOString(),
  issues: [],
  fixes: [],
  warnings: [],
  summary: {}
};

console.log('🔍 Running Bitsacco Project Diagnostics...\n');

// 1. Check Node.js and npm versions
function checkEnvironment(): void {
  console.log('📋 Environment Check:');
  try {
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    
    console.log(`  ✅ Node.js: ${nodeVersion}`);
    console.log(`  ✅ npm: ${npmVersion}`);
    
    DIAGNOSTICS_REPORT.summary.nodeVersion = nodeVersion;
    DIAGNOSTICS_REPORT.summary.npmVersion = npmVersion;
  } catch (error: any) {
    DIAGNOSTICS_REPORT.issues.push(`Environment check failed: ${error.message}`);
  }
}

// 2. Check package.json dependencies
function checkDependencies(): void {
  console.log('\n📦 Dependency Analysis:');
  
  try {
    const packageJsonContent = fs.readFileSync('package.json', 'utf8');
    const packageJson: PackageJson = JSON.parse(packageJsonContent);
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for deprecated packages
    const deprecatedPackages: Record<string, string> = {
      'elevenlabs': '@elevenlabs/elevenlabs-js',
      'helmet': '@fastify/helmet (for Fastify apps)',
      'docker-compose': 'Not needed in dependencies'
    };
    
    Object.entries(deprecatedPackages).forEach(([pkg, replacement]) => {
      if (dependencies[pkg]) {
        DIAGNOSTICS_REPORT.warnings.push(`Deprecated package: ${pkg} → ${replacement}`);
        console.log(`  ⚠️  ${pkg} is deprecated, use ${replacement}`);
      }
    });
    
    // Check for missing critical dependencies
    const criticalDeps = ['fastify', 'whatsapp-web.js', 'winston', 'dotenv'];
    criticalDeps.forEach(dep => {
      if (!dependencies[dep]) {
        DIAGNOSTICS_REPORT.issues.push(`Missing critical dependency: ${dep}`);
        console.log(`  ❌ Missing: ${dep}`);
      } else {
        console.log(`  ✅ Found: ${dep}`);
      }
    });
    
    DIAGNOSTICS_REPORT.summary.totalDependencies = Object.keys(dependencies).length;
    
  } catch (error: any) {
    DIAGNOSTICS_REPORT.issues.push(`Package.json analysis failed: ${error.message}`);
  }
}

// 3. Check for duplicate files
function checkDuplicates(): void {
  console.log('\n🔄 Duplicate File Check:');
  
  const fileHashes = new Map<string, string>();
  const duplicates: DuplicateFile[] = [];
  
  function scanDirectory(dir: string): void {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const hash = crypto.createHash('md5').update(content).digest('hex');
          
          if (fileHashes.has(hash)) {
            duplicates.push({
              original: fileHashes.get(hash)!,
              duplicate: fullPath,
              size: stat.size
            });
          } else {
            fileHashes.set(hash, fullPath);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  }
  
  if (fs.existsSync('src')) {
    scanDirectory('src');
  }
  
  if (duplicates.length === 0) {
    console.log('  ✅ No duplicate files found');
  } else {
    duplicates.forEach(dup => {
      console.log(`  ⚠️  Duplicate: ${dup.duplicate} (same as ${dup.original})`);
      DIAGNOSTICS_REPORT.warnings.push(`Duplicate file: ${dup.duplicate}`);
    });
  }
  
  DIAGNOSTICS_REPORT.summary.duplicateFiles = duplicates.length;
}

// 4. Check for unused imports
function checkUnusedImports(): void {
  console.log('\n📝 Unused Import Analysis:');
  
  const unusedImports: UnusedImport[] = [];
  
  function analyzeFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const imports: ImportInfo[] = [];
      const usages = new Set<string>();
      
      // Extract imports
      lines.forEach((line, index) => {
        const importMatch = line.match(/import\s+(\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const imported = importMatch[1];
          if (imported.startsWith('{')) {
            // Named imports
            const named = imported.slice(1, -1).split(',').map(s => s.trim());
            named.forEach(name => imports.push({ name, line: index + 1, type: 'named' }));
          } else {
            // Default import
            imports.push({ name: imported, line: index + 1, type: 'default' });
          }
        }
        
        // Track usage
        imports.forEach(imp => {
          if (line.includes(imp.name) && !line.includes('import')) {
            usages.add(imp.name);
          }
        });
      });
      
      // Find unused
      imports.forEach(imp => {
        if (!usages.has(imp.name)) {
          unusedImports.push({
            file: filePath,
            import: imp.name,
            line: imp.line
          });
        }
      });
      
    } catch (error) {
      // Skip files that can't be analyzed
    }
  }
  
  function scanForJS(dir: string): void {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanForJS(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.ts')) {
        analyzeFile(fullPath);
      }
    });
  }
  
  if (fs.existsSync('src')) {
    scanForJS('src');
  }
  
  if (unusedImports.length === 0) {
    console.log('  ✅ No obvious unused imports found');
  } else {
    unusedImports.slice(0, 10).forEach(unused => {
      console.log(`  ⚠️  ${unused.file}:${unused.line} - unused '${unused.import}'`);
    });
    if (unusedImports.length > 10) {
      console.log(`  ... and ${unusedImports.length - 10} more`);
    }
  }
  
  DIAGNOSTICS_REPORT.summary.unusedImports = unusedImports.length;
}

// 5. Check project structure
function checkProjectStructure(): void {
  console.log('\n🏗️  Project Structure Check:');
  
  const expectedDirs = ['src', 'tests', 'python'];
  const expectedFiles = ['package.json', 'README.md', '.gitignore', 'tsconfig.json'];
  
  expectedDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`  ✅ Directory: ${dir}`);
    } else {
      console.log(`  ⚠️  Missing directory: ${dir}`);
      DIAGNOSTICS_REPORT.warnings.push(`Missing directory: ${dir}`);
    }
  });
  
  expectedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✅ File: ${file}`);
    } else {
      console.log(`  ❌ Missing file: ${file}`);
      DIAGNOSTICS_REPORT.issues.push(`Missing file: ${file}`);
    }
  });
  
  // Check TypeScript configuration
  if (fs.existsSync('tsconfig.json')) {
    try {
      const tsconfigContent = fs.readFileSync('tsconfig.json', 'utf8');
      const tsconfig = JSON.parse(tsconfigContent);
      
      if (tsconfig.compilerOptions?.strict) {
        console.log('  ✅ TypeScript strict mode enabled');
      } else {
        console.log('  ⚠️  Consider enabling TypeScript strict mode');
        DIAGNOSTICS_REPORT.warnings.push('TypeScript strict mode not enabled');
      }
    } catch (error) {
      console.log('  ⚠️  Could not parse tsconfig.json');
    }
  }
}

// 6. Security check
function checkSecurity(): void {
  console.log('\n🔒 Security Analysis:');
  
  try {
    // Check for audit issues
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit: AuditResult = JSON.parse(auditResult);
    
    if (audit.vulnerabilities) {
      const vulnCount = Object.keys(audit.vulnerabilities).length;
      console.log(`  ⚠️  Found ${vulnCount} vulnerabilities`);
      DIAGNOSTICS_REPORT.warnings.push(`${vulnCount} npm audit vulnerabilities`);
    } else {
      console.log('  ✅ No vulnerabilities found');
    }
  } catch (error) {
    console.log('  ⚠️  Could not run security audit');
  }
  
  // Check for sensitive files
  const sensitiveFiles = ['.env', 'config.json', 'secrets.json'];
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ⚠️  Sensitive file present: ${file} (ensure it's in .gitignore)`);
    }
  });
}

// 7. Check TypeScript migration status
function checkTypeScriptMigration(): void {
  console.log('\n🔄 TypeScript Migration Status:');
  
  const jsFiles: string[] = [];
  const tsFiles: string[] = [];
  
  function scanForFiles(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanForFiles(fullPath);
      } else if (item.endsWith('.js') && !item.endsWith('.test.js')) {
        jsFiles.push(fullPath);
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        tsFiles.push(fullPath);
      }
    });
  }
  
  scanForFiles('src');
  scanForFiles('scripts');
  scanForFiles('tests');
  
  console.log(`  📊 JavaScript files: ${jsFiles.length}`);
  console.log(`  📊 TypeScript files: ${tsFiles.length}`);
  
  if (jsFiles.length > 0) {
    console.log('  ⚠️  Remaining JavaScript files to convert:');
    jsFiles.forEach(file => console.log(`     - ${file}`));
    DIAGNOSTICS_REPORT.warnings.push(`${jsFiles.length} JavaScript files remain to be converted`);
  } else {
    console.log('  ✅ All JavaScript files converted to TypeScript');
  }
  
  // Check for type declarations
  if (fs.existsSync('src/@types')) {
    console.log('  ✅ Custom type declarations found');
  } else {
    console.log('  ⚠️  Consider adding custom type declarations in src/@types');
  }
}

// 8. Generate recommendations
function generateRecommendations(): void {
  console.log('\n💡 Recommendations:');
  
  const recommendations = [
    'Complete TypeScript migration for all remaining JavaScript files',
    'Update whatsapp-web.js to latest stable version for security fixes',
    'Replace deprecated elevenlabs package with @elevenlabs/elevenlabs-js',
    'Remove unused devDependencies like artillery and docker-compose from package.json',
    'Add comprehensive .eslintignore file with TypeScript support',
    'Set up pre-commit hooks with husky for code quality and type checking',
    'Consider using npm workspaces for the hybrid Node.js/Python architecture',
    'Add Docker health checks for production deployment',
    'Implement comprehensive error handling and logging with TypeScript types',
    'Add integration tests for the WhatsApp bot functionality with proper typing',
    'Set up monitoring and alerting for production environment',
    'Configure TypeScript build optimization for production',
    'Add type-only imports where appropriate to reduce bundle size',
    'Implement proper error boundaries with typed error handling'
  ];
  
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
}

// Run all diagnostics
async function runDiagnostics(): Promise<void> {
  checkEnvironment();
  checkDependencies();
  checkDuplicates();
  checkUnusedImports();
  checkProjectStructure();
  checkSecurity();
  checkTypeScriptMigration();
  generateRecommendations();
  
  // Write report
  fs.writeFileSync('DIAGNOSTICS_REPORT.json', JSON.stringify(DIAGNOSTICS_REPORT, null, 2));
  
  console.log('\n📊 Diagnostics Summary:');
  console.log(`  Issues: ${DIAGNOSTICS_REPORT.issues.length}`);
  console.log(`  Warnings: ${DIAGNOSTICS_REPORT.warnings.length}`);
  console.log(`  Total Dependencies: ${DIAGNOSTICS_REPORT.summary.totalDependencies || 'N/A'}`);
  console.log(`  Duplicate Files: ${DIAGNOSTICS_REPORT.summary.duplicateFiles || 0}`);
  console.log(`  Unused Imports: ${DIAGNOSTICS_REPORT.summary.unusedImports || 0}`);
  
  console.log('\n✅ Diagnostics complete! Report saved to DIAGNOSTICS_REPORT.json');
  
  if (DIAGNOSTICS_REPORT.issues.length > 0) {
    console.log('\n❌ Critical issues found that need attention:');
    DIAGNOSTICS_REPORT.issues.forEach(issue => console.log(`   - ${issue}`));
    process.exit(1);
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);
