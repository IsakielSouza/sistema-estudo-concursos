# 🚀 Script de Upload Automático - Curso PRF 2023

## 📋 **O que o Script Faz:**

### ✅ **Detecção Automática:**
- Analisa todas as pastas de disciplinas
- Identifica automaticamente os PDFs das aulas
- Mapeia disciplinas para categorias do sistema
- Organiza por sequência de aulas (00, 01, 02...)

### ✅ **Upload Inteligente:**
- Cria materiais com títulos organizados
- Gera descrições automáticas
- Adiciona tags relevantes
- Mapeia para tipos de concurso corretos

## 🔧 **Como Usar:**

### **Passo 1: Configurar o Script**
```bash
# Edite o arquivo upload-prf-materials.js
# Configure a URL do seu repositório GitHub:
GITHUB_BASE_URL = 'https://github.com/SEU-USUARIO/sistema-estudo-concursos-materiais/blob/main/PRF%20Pre%20Edital%202023%20Estrategia%20Concursos%202023'
```

### **Passo 2: Colocar o Script na Pasta Correta**
```bash
# O script deve estar na mesma pasta onde está:
📁 PRF Pre Edital 2023 Estrategia Concursos 2023/
```

### **Passo 3: Executar o Script**
```bash
# Gerar configuração primeiro:
node upload-prf-materials.js --config

# Executar upload:
node upload-prf-materials.js

# Ver ajuda:
node upload-prf-materials.js --help
```

## 📚 **Disciplinas Mapeadas Automaticamente:**

| Pasta Original | Categoria Sistema | Tipo Concurso |
|----------------|-------------------|---------------|
| Direito Constitucional | Direito Constitucional | Policial |
| Direito Penal | Direito Penal | Policial |
| Direito Administrativo | Direito Administrativo | Policial |
| Direito Processual Penal | Direito Processual | Policial |
| Direitos Humanos | Direito Constitucional | Policial |
| Legislação Penal Especial | Direito Penal | Policial |
| Legislação de Trânsito | Direito Penal | Policial |
| Português | Português | Policial |
| Física | Matemática | Policial |
| Informática | Informática | Policial |
| Inglês | Inglês | Policial |
| Espanhol | Espanhol | Policial |
| ECA | Direito Penal | Policial |
| Ética e Cidadania | Atualidades | Policial |
| Geopolítica | Atualidades | Policial |
| Raciocínio Lógico | Raciocínio Lógico | Policial |

## 🎯 **Exemplo de Material Gerado:**

### **Entrada (Arquivo):**
```
📄 Aula 05.pdf
```

### **Saída (Sistema):**
- **Título**: "Direito Constitucional - Aula 05 - PRF Pre Edital 2023"
- **Descrição**: "Aula 05 de Direito Constitucional para concurso PRF 2023. Material completo e atualizado conforme edital."
- **Categoria**: "Direito Constitucional"
- **Tipo Concurso**: "Policial"
- **Tags**: "prf, policial, 2023, pre-edital, estrategia-concursos, aula-05, direito, constitucional"
- **Autor**: "Estratégia Concursos"

## ⚙️ **Configurações Avançadas:**

### **Token de API (Opcional):**
```bash
# Se precisar de autenticação:
export API_TOKEN="seu-token-jwt"
node upload-prf-materials.js
```

### **URLs Personalizadas:**
```javascript
// No script, edite:
const GITHUB_BASE_URL = 'sua-url-personalizada';
const API_BASE_URL = 'http://localhost:3001/api/v1/materials';
```

## 🚨 **Troubleshooting:**

### **Erro: "Pasta não encontrada"**
- ✅ Verifique se o script está na pasta correta
- ✅ Confirme o nome da pasta: `PRF Pre Edital 2023 Estrategia Concursos 2023`

### **Erro: "Nenhum PDF encontrado"**
- ✅ Verifique se as pastas contêm arquivos `.pdf`
- ✅ Confirme se os nomes seguem o padrão: `Aula XX.pdf`

### **Erro de API:**
- ✅ Verifique se o backend está rodando na porta 3001
- ✅ Confirme se a URL da API está correta
- ✅ Verifique se precisa de token de autenticação

## 📊 **Resultado Esperado:**

### **Antes do Script:**
- 0 materiais no sistema
- Sistema vazio

### **Depois do Script:**
- ~200+ materiais organizados
- Todas as disciplinas mapeadas
- Aulas em sequência correta
- Sistema completo e funcional

## 🎉 **Após o Upload:**

1. **Acesse** `/materials` no seu sistema
2. **Veja** todos os materiais organizados
3. **Use os filtros** por categoria e tipo de concurso
4. **Busque** por disciplinas específicas
5. **Acesse** os PDFs diretamente do GitHub

## 🔄 **Para Atualizações Futuras:**

- Execute o script novamente para novos materiais
- O sistema detectará automaticamente mudanças
- Materiais duplicados serão atualizados
- Sistema sempre sincronizado

---

**🚀 Script 100% Automático - Zero Configuração Manual! 🚀** 