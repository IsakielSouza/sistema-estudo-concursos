#!/usr/bin/env node

/**
 * Script de Configuração para Upload Automático
 * 
 * Este script ajuda a configurar o upload automático dos materiais do curso PRF
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Configuração do Upload Automático - Curso PRF 2023\n');

// Função para fazer pergunta
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Função principal de configuração
async function setupUpload() {
  try {
    console.log('📋 Vamos configurar o upload automático!\n');
    
    // 1. Perguntar nome de usuário do GitHub
    const githubUsername = await askQuestion('👤 Digite seu nome de usuário do GitHub: ');
    
    // 2. Confirmar nome do repositório
    const repoName = await askQuestion('📁 Nome do repositório (padrão: sistema-estudo-concursos-materiais): ');
    const finalRepoName = repoName || 'sistema-estudo-concursos-materiais';
    
    // 3. Gerar URL do GitHub
    const githubBaseUrl = `https://github.com/${githubUsername}/${finalRepoName}/blob/main/PRF%20Pre%20Edital%202023%20Estrategia%20Concursos%202023`;
    
    // 4. Confirmar configurações
    console.log('\n📋 Configurações que serão aplicadas:');
    console.log(`👤 Usuário GitHub: ${githubUsername}`);
    console.log(`📁 Repositório: ${finalRepoName}`);
    console.log(`🔗 URL Base: ${githubBaseUrl}`);
    
    const confirm = await askQuestion('\n✅ Confirma essas configurações? (s/n): ');
    
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
      console.log('❌ Configuração cancelada.');
      rl.close();
      return;
    }
    
    // 5. Atualizar o script principal
    const scriptPath = path.join(__dirname, 'upload-prf-materials.js');
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Substituir a URL do GitHub
    scriptContent = scriptContent.replace(
      /const GITHUB_BASE_URL = '.*?';/,
      `const GITHUB_BASE_URL = '${githubBaseUrl}';`
    );
    
    // Substituir o nome de usuário
    scriptContent = scriptContent.replace(
      /https:\/\/github.com\/seu-usuario\//g,
      `https://github.com/${githubUsername}/`
    );
    
    // Salvar o script atualizado
    fs.writeFileSync(scriptPath, scriptContent);
    
    // 6. Gerar arquivo de configuração
    const config = {
      githubUsername: githubUsername,
      repositoryName: finalRepoName,
      githubBaseUrl: githubBaseUrl,
      courseName: 'PRF Pre Edital 2023 Estratégia Concursos',
      setupDate: new Date().toISOString(),
      instructions: [
        '1. Coloque o script upload-prf-materials.js na pasta do curso PRF',
        '2. Execute: node upload-prf-materials.js',
        '3. O script detectará automaticamente todas as disciplinas e aulas'
      ]
    };
    
    const configPath = path.join(__dirname, 'upload-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('\n✅ Configuração concluída com sucesso!');
    console.log(`📝 Arquivo de configuração salvo: ${configPath}`);
    console.log(`🔧 Script atualizado: ${scriptPath}`);
    
    // 7. Instruções finais
    console.log('\n🚀 Próximos Passos:');
    console.log('1. 📁 Copie o script upload-prf-materials.js para a pasta do curso PRF');
    console.log('2. 🎯 Execute: node upload-prf-materials.js');
    console.log('3. 📚 Aguarde o upload automático de todos os materiais');
    console.log('4. 🌐 Acesse /materials no seu sistema para ver os resultados');
    
    // 8. Verificar se a pasta do curso existe
    const coursePath = path.join(process.cwd(), 'PRF Pre Edital 2023 Estrategia Concursos 2023');
    if (fs.existsSync(coursePath)) {
      console.log('\n🎉 Pasta do curso encontrada! Você pode executar o script agora.');
    } else {
      console.log('\n⚠️  Pasta do curso não encontrada no diretório atual.');
      console.log('💡 Certifique-se de colocar o script na pasta correta.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
  } finally {
    rl.close();
  }
}

// Executar configuração
setupUpload(); 