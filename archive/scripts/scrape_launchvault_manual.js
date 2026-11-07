import fs from 'fs';

// Manually extracted skills from the LaunchVault blog based on the WebFetch results
const newSkills = [
  {
    title: "Algorithmic Art",
    url: "https://github.com/anthropics/skills",
    description: "Create generative art using p5.js with seeded randomness, flow fields, and particle systems. Best for generative artists and creative coders.",
    category: "Creative & Media"
  },
  {
    title: "Excel Mastery (XLSX)",
    url: "https://github.com/anthropics/skills/tree/main/document-skills/xlsx",
    description: "Create, edit, and analyze Excel spreadsheets with support for formulas, charts, and data transformations.",
    category: "Document Processing"
  },
  {
    title: "PowerPoint (PPTX)",
    url: "https://github.com/anthropics/skills/tree/main/document-skills/pptx",
    description: "Read, generate, and adjust PowerPoint slides, layouts, and templates.",
    category: "Document Processing"
  },
  {
    title: "Word Processing (DOCX)",
    url: "https://github.com/anthropics/skills/tree/main/document-skills/docx",
    description: "Create, edit, and analyze Word documents with tracked changes, comments, and formatting.",
    category: "Document Processing"
  },
  {
    title: "PDF Master",
    url: "https://github.com/anthropics/skills/tree/main/document-skills/pdf",
    description: "Extract text, tables, and metadata from PDFs. Merge and annotate PDF files.",
    category: "Document Processing"
  }
];

// Load existing skills
const existingSkills = JSON.parse(fs.readFileSync('skills.json', 'utf-8'));
const existingTitles = new Set(existingSkills.map(s => s.title.toLowerCase()));

// Filter out duplicates
const uniqueNewSkills = newSkills.filter(skill =>
  !existingTitles.has(skill.title.toLowerCase())
);

console.log(`Total new skills: ${newSkills.length}`);
console.log(`Unique (non-duplicate) new skills: ${uniqueNewSkills.length}`);

if (uniqueNewSkills.length > 0) {
  console.log('\nNew skills to add:');
  uniqueNewSkills.forEach((skill, i) => {
    console.log(`${i + 1}. ${skill.title} (${skill.category})`);
  });

  // Merge with existing skills
  const mergedSkills = [...existingSkills, ...uniqueNewSkills];

  // Save updated skills
  fs.writeFileSync('skills.json', JSON.stringify(mergedSkills, null, 2));
  console.log(`\n✓ Added ${uniqueNewSkills.length} new skills to skills.json`);
  console.log(`✓ Total skills: ${mergedSkills.length}`);
} else {
  console.log('\nNo new unique skills to add (all are duplicates)');
}
