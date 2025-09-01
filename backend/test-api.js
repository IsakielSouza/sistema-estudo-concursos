// Script de teste rápido para a API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testAPI() {
  console.log('🧪 Testando API do Sistema de Estudo para Concursos...\n');

  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    console.log('📊 Status:', healthResponse.data.data.status);
    console.log('⏰ Timestamp:', healthResponse.data.data.timestamp);
    console.log('');

    // Teste 2: Info da API
    console.log('2️⃣ Testando Info da API...');
    const infoResponse = await axios.get(`${API_BASE_URL}/info`);
    console.log('✅ API Info:', infoResponse.data.data.name);
    console.log('📱 Mobile Support:', infoResponse.data.data.mobileSupport);
    console.log('');

    // Teste 3: Listar materiais (deve retornar vazio se não há dados)
    console.log('3️⃣ Testando endpoint de materiais...');
    const materialsResponse = await axios.get(`${API_BASE_URL}/materials`);
    console.log('✅ Materiais encontrados:', materialsResponse.data.data?.length || 0);
    console.log('');

    // Teste 4: Listar usuários (deve retornar vazio se não há dados)
    console.log('4️⃣ Testando endpoint de usuários...');
    const usersResponse = await axios.get(`${API_BASE_URL}/users`);
    console.log('✅ Usuários encontrados:', usersResponse.data.data?.length || 0);
    console.log('');

    console.log('🎉 Todos os testes passaram! A API está funcionando corretamente.');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Configure o Supabase (execute o schema.sql)');
    console.log('2. Teste o registro de usuários');
    console.log('3. Teste o login');
    console.log('4. Teste a criação de materiais');

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Resposta:', error.response.data);
    }
    
    console.log('');
    console.log('🔧 Possíveis soluções:');
    console.log('1. Verifique se o backend está rodando (npm run start:dev)');
    console.log('2. Verifique se as variáveis de ambiente estão configuradas');
    console.log('3. Verifique se o Supabase está configurado corretamente');
  }
}

// Executar teste
testAPI(); 