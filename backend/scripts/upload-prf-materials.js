#!/usr/bin/env node

/**
 * Script Automático para Upload de Materiais do Curso PRF
 * 
 * Este script analisa automaticamente a estrutura das pastas do curso PRF
 * e faz upload de todos os materiais para o sistema de materiais.
 * 
 * Como usar:
 * 1. Coloque este script na pasta do curso PRF
 * 2. Execute: node upload-prf-materials.js
 * 3. O script detectará automaticamente todas as disciplinas e aulas
 */

const fs = require('fs');
const path = require('path');

// Configurações
const COURSE_BASE_PATH = './PRF Pre Edital 2023 Estrategia Concursos 2023';
const API_BASE_URL = 'http://localhost:3001/api/v1/materials';
const GITHUB_BASE_URL = 'https://github.com/cd backend/scripts && node test-upload.js/isakielsouza/blob/main/PRF%20Pre%20Edital%202023%20Estrategia%20Concursos%202023';

// Mapeamento de disciplinas para categorias do sistema
const DISCIPLINE_MAPPING = {
  'Direito Constitucional': 'Direito Constitucional',
  'Direito Penal': 'Direito Penal',
  'Direito Administrativo': 'Direito Administrativo',
  'Direito Processual Penal': 'Direito Processual',
  'Direitos Humanos': 'Direito Constitucional',
  'Legislação Penal Especial': 'Direito Penal',
  'Legislação de Trânsito': 'Direito Penal',
  'Português': 'Português',
  'Física': 'Matemática',
  'Informática': 'Informática',
  'Inglês': 'Inglês',
  'Espanhol': 'Espanhol',
  'ECA': 'Direito Penal',
  'Ética e Cidadania': 'Atualidades',
  'Geopolítica': 'Atualidades',
  'Raciocinio Lógico': 'Raciocínio Lógico',
  'Bizu Estratégico': 'Atualidades',
  'Simulados': 'Simulados',
  'Trilha Estratégica': 'Atualidades',
  'Discursivas': 'Português'
};

// Mapeamento de disciplinas para tipo de concurso
const EXAM_TYPE_MAPPING = {
  'Direito Constitucional': 'Policial',
  'Direito Penal': 'Policial',
  'Direito Administrativo': 'Policial',
  'Direito Processual Penal': 'Policial',
  'Direitos Humanos': 'Policial',
  'Legislação Penal Especial': 'Policial',
  'Legislação de Trânsito': 'Policial',
  'Português': 'Policial',
  'Física': 'Policial',
  'Informática': 'Policial',
  'Inglês': 'Policial',
  'Espanhol': 'Policial',
  'ECA': 'Policial',
  'Ética e Cidadania': 'Policial',
  'Geopolítica': 'Policial',
  'Raciocinio Lógico': 'Policial',
  'Bizu Estratégico': 'Policial',
  'Simulados': 'Policial',
  'Trilha Estratégica': 'Policial',
  'Discursivas': 'Policial'
};

// Função para listar diretórios
function listDirectories(basePath) {
  try {
    const items = fs.readdirSync(basePath, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => !name.startsWith('.'));
  } catch (error) {
    console.error(`Erro ao listar diretórios em ${basePath}:`, error.message);
    return [];
  }
}

// Função para listar arquivos PDF em um diretório
function listPDFFiles(dirPath) {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    return items
      .filter(item => item.isFile() && item.name.toLowerCase().endsWith('.pdf'))
      .map(item => item.name)
      .sort((a, b) => {
        // Extrair número da aula para ordenação
        const aMatch = a.match(/Aula (\d+)/);
        const bMatch = b.match(/Aula (\d+)/);
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        return a.localeCompare(b);
      });
  } catch (error) {
    console.error(`Erro ao listar PDFs em ${dirPath}:`, error.message);
    return [];
  }
}

// Função para extrair número da aula
function extractLessonNumber(filename) {
  const match = filename.match(/Aula (\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Função para gerar URL do GitHub
function generateGitHubURL(discipline, filename) {
  const encodedDiscipline = encodeURIComponent(discipline);
  const encodedFilename = encodeURIComponent(filename);
  return `${GITHUB_BASE_URL}/${encodedDiscipline}/${encodedFilename}`;
}

// Função para gerar título do material
function generateMaterialTitle(discipline, filename) {
  const lessonNumber = extractLessonNumber(filename);
  if (lessonNumber !== null) {
    return `${discipline} - Aula ${lessonNumber.toString().padStart(2, '0')} - PRF Pre Edital 2023`;
  }
  return `${discipline} - ${filename.replace('.pdf', '')} - PRF Pre Edital 2023`;
}

// Função para gerar descrição
function generateDescription(discipline, filename) {
  const lessonNumber = extractLessonNumber(filename);
  if (lessonNumber !== null) {
    return `Aula ${lessonNumber.toString().padStart(2, '0')} de ${discipline} para concurso PRF 2023. Material completo e atualizado conforme edital.`;
  }
  return `Material de ${discipline} para concurso PRF 2023. Conteúdo completo e atualizado conforme edital.`;
}

// Função para gerar tags
function generateTags(discipline, filename) {
  const lessonNumber = extractLessonNumber(filename);
  const baseTags = ['prf', 'policial', '2023', 'pre-edital', 'estrategia-concursos'];
  
  if (lessonNumber !== null) {
    baseTags.push(`aula-${lessonNumber.toString().padStart(2, '0')}`);
  }
  
  // Adicionar tags específicas da disciplina
  const disciplineTags = discipline.toLowerCase().replace(/\s+/g, '-').split('-');
  baseTags.push(...disciplineTags);
  
  return baseTags.join(', ');
}

// Função para fazer upload de um material
async function uploadMaterial(materialData) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN || 'your-token-here'}`
      },
      body: JSON.stringify(materialData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Material criado: ${materialData.title}`);
      return result;
    } else {
      console.error(`❌ Erro ao criar material ${materialData.title}:`, response.statusText);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erro ao fazer upload de ${materialData.title}:`, error.message);
    return null;
  }
}

// Função principal para processar todas as disciplinas
async function processAllDisciplines() {
  console.log('🚀 Iniciando upload automático de materiais do curso PRF...\n');
  
  const basePath = path.resolve(COURSE_BASE_PATH);
  console.log(`📁 Analisando pasta: ${basePath}\n`);
  
  if (!fs.existsSync(basePath)) {
    console.error(`❌ Pasta não encontrada: ${basePath}`);
    console.log('💡 Certifique-se de que o script está na pasta correta');
    return;
  }
  
  const disciplines = listDirectories(basePath);
  console.log(`📚 Disciplinas encontradas: ${disciplines.length}\n`);
  
  let totalMaterials = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const discipline of disciplines) {
    const disciplinePath = path.join(basePath, discipline);
    const pdfFiles = listPDFFiles(disciplinePath);
    
    if (pdfFiles.length === 0) {
      console.log(`⚠️  Nenhum PDF encontrado em: ${discipline}`);
      continue;
    }
    
    console.log(`📖 Processando ${discipline} (${pdfFiles.length} aulas):`);
    
    const category = DISCIPLINE_MAPPING[discipline] || 'Outros';
    const examType = EXAM_TYPE_MAPPING[discipline] || 'Policial';
    
    for (const pdfFile of pdfFiles) {
      totalMaterials++;
      
      const materialData = {
        title: generateMaterialTitle(discipline, pdfFile),
        description: generateDescription(discipline, pdfFile),
        file_url: generateGitHubURL(discipline, pdfFile),
        category: category,
        tags: generateTags(discipline, pdfFile),
        author: 'Estratégia Concursos',
        exam_type: examType
      };
      
      console.log(`  📄 ${pdfFile} → ${category}`);
      
      const result = await uploadMaterial(materialData);
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('');
  }
  
  // Resumo final
  console.log('🎯 RESUMO DO UPLOAD:');
  console.log(`📊 Total de materiais processados: ${totalMaterials}`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📚 Disciplinas processadas: ${disciplines.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Upload concluído com sucesso!');
    console.log('🌐 Acesse /materials para ver todos os materiais');
  } else {
    console.log('\n⚠️  Nenhum material foi enviado. Verifique as configurações.');
  }
}

// Função para gerar arquivo de configuração
function generateConfigFile() {
  const config = {
    courseName: 'PRF Pre Edital 2023 Estratégia Concursos',
    githubBaseUrl: GITHUB_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    disciplines: DISCIPLINE_MAPPING,
    examTypes: EXAM_TYPE_MAPPING
  };
  
  fs.writeFileSync('upload-config.json', JSON.stringify(config, null, 2));
  console.log('📝 Arquivo de configuração gerado: upload-config.json');
}

// Função para mostrar ajuda
function showHelp() {
  console.log(`
📚 Script de Upload Automático - Curso PRF 2023

USO:
  node upload-prf-materials.js [opção]

OPÇÕES:
  --help, -h          Mostra esta ajuda
  --config, -c        Gera arquivo de configuração
  --upload, -u        Executa o upload (padrão)

EXEMPLOS:
  node upload-prf-materials.js              # Executa upload
  node upload-prf-materials.js --config     # Gera configuração
  node upload-prf-materials.js --help       # Mostra ajuda

CONFIGURAÇÃO:
  1. Coloque este script na pasta do curso PRF
  2. Configure o GITHUB_BASE_URL no script
  3. Configure o API_TOKEN se necessário
  4. Execute o script

ESTRUTURA ESPERADA:
  📁 PRF Pre Edital 2023 Estrategia Concursos 2023/
    📁 Direito Constitucional/
      📄 Aula 00.pdf
      📄 Aula 01.pdf
      📄 Aula 02.pdf
      ...
  `);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--config') || args.includes('-c')) {
    generateConfigFile();
    return;
  }
  
  // Executar upload por padrão
  await processAllDisciplines();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  processAllDisciplines,
  generateConfigFile,
  DISCIPLINE_MAPPING,
  EXAM_TYPE_MAPPING
}; 