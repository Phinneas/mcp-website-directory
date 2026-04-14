#!/usr/bin/env node

/**
 * Simple script to add deployment property to static servers
 */

import fs from 'fs';
import path from 'path';

function addDeploymentProperty(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Simple regex approach - add deployment property after fields: line in each server object
  // Add after the fields: line for each server
  let modifiedContent = fileContent.replace(
    /(\s+id:\s*['"][\w-]+['"],\s+fields:\s*\{)/g,
    '$1\n    $&    deployment: \'local_stdio\',\n'
  );
  
  // Fix the replacement to put deployment properly after id line
  modifiedContent = fileContent.replace(
    /(\s+id:\s*['"][\w-]+['"],)\n(\s+fields:\s*\{)/g,
    '$1\n    deployment: \'local_stdio\',\n$2'
  );
  
  // Add deployment property after id: line
  modifiedContent = fileContent.replace(/(\n\s+id:\s*['"][\w-]+['"],\n)/g, '$1    deployment: \'local_stdio\',\n');
  
  fs.writeFileSync(filePath, modifiedContent, 'utf8');
  console.log('Added deployment property to static servers');
}

const filePath = path.join(process.cwd(), 'src', 'data', 'staticServers.js');
addDeploymentProperty(filePath);
