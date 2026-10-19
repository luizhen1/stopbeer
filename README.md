# StopBeer

Aplicação de pedidos e gestão para uma distribuidora de bebidas, feita com Next.js App Router, React e Firebase.

## Rodar localmente

```bash
npm install
npm run dev
```

Sem configuração do Firebase, o site abre em modo demonstração: catálogo, carrinho, pedidos e mudanças de estoque ficam salvos no `localStorage`. No painel (`/admin`), qualquer e-mail e senha abrem a demonstração local.

## Conectar ao Firebase

1. Crie um projeto Firebase com Authentication (Email/Senha) e Cloud Firestore ativados.
2. Copie `.env.example` para `.env.local` e preencha os valores de configuração do app web Firebase. Defina `NEXT_PUBLIC_STORE_WHATSAPP` com o número comercial em formato internacional, somente dígitos.
3. Crie o usuário proprietário em Authentication e substitua `REPLACE_WITH_OWNER_UID` em [firestore.rules](./firestore.rules) pelo UID desse usuário. Publique as regras no Firestore.
4. Inicie com `npm run dev`.

Os documentos de produto usam os campos descritos no prompt. Ao conectar um banco vazio, cadastre os produtos pelo painel. Pedidos são criados com status `pendente`; a leitura e as alterações dos pedidos ficam restritas ao proprietário pelas regras fornecidas.

## Produção

Execute `npm run build` e `npm run start` para servir a aplicação Next.js em produção. A rota `/admin` é criada pelo App Router.
