#!/usr/bin/env node

/**
 * Script de Teste para Upload Automático - Curso PRF 2023
 * 
 * Este script já está configurado com suas informações do GitHub
 * e pode ser executado diretamente para testar o sistema
 */

const fs = require('fs');
const path = require('path');

// Configurações já configuradas para seu repositório
const COURSE_BASE_PATH = './PRF Pre Edital 2023 Estrategia Concursos 2023';
const API_BASE_URL = 'http://localhost:3001/api/v1/materials';
const GITHUB_BASE_URL = 'https://github.com/isakiel09/sistema-estudo-concursos-materiais/blob/main/PRF%20Pre%20Edital%202023%20Estrategia%20Concursos%202023';

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

// Função para fazer upload de um material (versão simulada para teste)
function simulateUpload(materialData) {
  console.log(`✅ Material simulado: ${materialData.title}`);
  console.log(`   📁 Categoria: ${materialData.category}`);
  console.log(`   🏷️  Tags: ${materialData.tags}`);
  console.log(`   🔗 URL: ${materialData.file_url}`);
  console.log('');
  return { success: true, id: `simulated-${Date.now()}` };
}

// Função principal para processar todas as disciplinas
async function processAllDisciplines(simulate = true) {
  console.log('🚀 Iniciando upload automático de materiais do curso PRF...\n');
  
  const basePath = path.resolve(COURSE_BASE_PATH);
  console.log(`📁 Analisando pasta: ${basePath}\n`);
  
  if (!fs.existsSync(basePath)) {
    console.error(`❌ Pasta não encontrada: ${basePath}`);
    console.log('💡 Certifique-se de que o script está na pasta correta');
    console.log('💡 A pasta deve se chamar: "PRF Pre Edital 2023 Estrategia Concursos 2023"');
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
      
      let result;
      if (simulate) {
        result = simulateUpload(materialData);
      } else {
        result = await uploadMaterial(materialData);
      }
      
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Pequena pausa para não sobrecarregar
      if (!simulate) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('');
  }
  
  // Resumo final
  console.log('🎯 RESUMO DO PROCESSAMENTO:');
  console.log(`📊 Total de materiais processados: ${totalMaterials}`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📚 Disciplinas processadas: ${disciplines.length}`);
  
  if (simulate) {
    console.log('\n🎭 MODO SIMULAÇÃO ATIVADO');
    console.log('💡 Para fazer upload real, execute: node test-upload.js --upload');
  } else {
    console.log('\n🎉 Upload real concluído com sucesso!');
    console.log('🌐 Acesse /materials para ver todos os materiais');
  }
}

// Função para mostrar ajuda
function showHelp() {
  console.log(`
📚 Script de Teste - Upload Automático - Curso PRF 2023

USO:
  node test-upload.js [opção]

OPÇÕES:
  --help, -h          Mostra esta ajuda
  --upload, -u        Executa upload real (não simulação)
  --simulate, -s      Executa em modo simulação (padrão)

EXEMPLOS:
  node test-upload.js              # Modo simulação (padrão)
  node test-upload.js --upload     # Upload real para o sistema
  node test-upload.js --help       # Mostra ajuda

CONFIGURAÇÃO:
  ✅ Script já configurado com seu repositório GitHub
  ✅ URLs e mapeamentos configurados
  ✅ Pronto para uso imediato

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
  
  const simulate = !args.includes('--upload') && !args.includes('-u');
  
  if (simulate) {
    console.log('🎭 MODO SIMULAÇÃO ATIVADO - Nenhum material será enviado ao sistema\n');
  } else {
    console.log('🚀 MODO UPLOAD REAL ATIVADO - Materiais serão enviados ao sistema\n');
  }
  
  // Executar processamento
  await processAllDisciplines(simulate);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  processAllDisciplines,
  DISCIPLINE_MAPPING,
  EXAM_TYPE_MAPPING
}; 