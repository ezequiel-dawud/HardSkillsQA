/* Massa de dados do cenario (subconjunto do banco de pratica), usada pela API falsa. */
window.DADOS = {
 "produtos": [
  {
   "id": 1,
   "nome": "Teclado Mecanico",
   "categoria": "Perifericos",
   "preco": 320.0,
   "estoque": 76,
   "ativo": false
  },
  {
   "id": 2,
   "nome": "Mouse Gamer",
   "categoria": "Perifericos",
   "preco": 180.0,
   "estoque": 10,
   "ativo": true
  },
  {
   "id": 3,
   "nome": "Headset USB",
   "categoria": "Perifericos",
   "preco": 250.0,
   "estoque": 74,
   "ativo": true
  },
  {
   "id": 4,
   "nome": "Monitor 24pol",
   "categoria": "Monitores",
   "preco": 900.0,
   "estoque": 40,
   "ativo": true
  },
  {
   "id": 5,
   "nome": "Monitor 27pol",
   "categoria": "Monitores",
   "preco": 1450.0,
   "estoque": 26,
   "ativo": true
  },
  {
   "id": 6,
   "nome": "Webcam HD",
   "categoria": "Perifericos",
   "preco": 210.0,
   "estoque": 40,
   "ativo": true
  },
  {
   "id": 7,
   "nome": "SSD 1TB",
   "categoria": "Armazenamento",
   "preco": 480.0,
   "estoque": 50,
   "ativo": true
  },
  {
   "id": 8,
   "nome": "HD Externo 2TB",
   "categoria": "Armazenamento",
   "preco": 390.0,
   "estoque": 82,
   "ativo": true
  },
  {
   "id": 9,
   "nome": "Cadeira de Escritorio",
   "categoria": "Moveis",
   "preco": 780.0,
   "estoque": 40,
   "ativo": true
  },
  {
   "id": 10,
   "nome": "Suporte para Notebook",
   "categoria": "Acessorios",
   "preco": 95.0,
   "estoque": 119,
   "ativo": false
  },
  {
   "id": 11,
   "nome": "Hub USB-C",
   "categoria": "Acessorios",
   "preco": 130.0,
   "estoque": 58,
   "ativo": true
  },
  {
   "id": 12,
   "nome": "Cabo HDMI 2m",
   "categoria": "Acessorios",
   "preco": 35.0,
   "estoque": 72,
   "ativo": true
  },
  {
   "id": 13,
   "nome": "Notebook 14pol",
   "categoria": "Computadores",
   "preco": 3800.0,
   "estoque": 9,
   "ativo": true
  },
  {
   "id": 14,
   "nome": "Notebook 16pol",
   "categoria": "Computadores",
   "preco": 5200.0,
   "estoque": 64,
   "ativo": true
  },
  {
   "id": 15,
   "nome": "Mousepad Grande",
   "categoria": "Acessorios",
   "preco": 60.0,
   "estoque": 119,
   "ativo": true
  }
 ],
 "clientes": [
  {
   "id": 1,
   "nome": "Diego Silva",
   "email": "cliente1@exemplo.com",
   "cidade": "Curitiba",
   "estado": "PR",
   "ativo": true
  },
  {
   "id": 2,
   "nome": "Diego Carvalho",
   "email": "cliente2@exemplo.com",
   "cidade": "Fortaleza",
   "estado": "CE",
   "ativo": true
  },
  {
   "id": 3,
   "nome": "Bruno Silva",
   "email": "cliente3@exemplo.com",
   "cidade": "Campinas",
   "estado": "SP",
   "ativo": true
  },
  {
   "id": 4,
   "nome": "Vitor Silva",
   "email": "cliente4@exemplo.com",
   "cidade": "Fortaleza",
   "estado": "CE",
   "ativo": true
  },
  {
   "id": 5,
   "nome": "Sergio Costa",
   "email": "cliente5@exemplo.com",
   "cidade": "Belo Horizonte",
   "estado": "MG",
   "ativo": true
  },
  {
   "id": 6,
   "nome": "Ana Oliveira",
   "email": "cliente6@exemplo.com",
   "cidade": "Salvador",
   "estado": "BA",
   "ativo": true
  },
  {
   "id": 7,
   "nome": "Gabriela Lima",
   "email": "cliente7@exemplo.com",
   "cidade": "Campinas",
   "estado": "SP",
   "ativo": true
  },
  {
   "id": 8,
   "nome": "Lucas Lima",
   "email": "cliente8@exemplo.com",
   "cidade": "Manaus",
   "estado": "AM",
   "ativo": true
  },
  {
   "id": 9,
   "nome": "Olivia Almeida",
   "email": "cliente9@exemplo.com",
   "cidade": "Campinas",
   "estado": "SP",
   "ativo": false
  },
  {
   "id": 10,
   "nome": "Joao Carvalho",
   "email": "cliente10@exemplo.com",
   "cidade": "Manaus",
   "estado": "AM",
   "ativo": true
  },
  {
   "id": 11,
   "nome": "Carla Silva",
   "email": "cliente11@exemplo.com",
   "cidade": "Belo Horizonte",
   "estado": "MG",
   "ativo": true
  },
  {
   "id": 12,
   "nome": "Carla Santos",
   "email": "cliente12@exemplo.com",
   "cidade": "Campinas",
   "estado": "SP",
   "ativo": true
  }
 ],
 "pedidos": [
  {
   "id": 1,
   "cliente_id": 5,
   "data_pedido": "2025-04-03",
   "status": "enviado",
   "valor_total": 16770.0
  },
  {
   "id": 2,
   "cliente_id": 20,
   "data_pedido": "2025-07-06",
   "status": "cancelado",
   "valor_total": 390.0
  },
  {
   "id": 3,
   "cliente_id": 20,
   "data_pedido": "2025-07-19",
   "status": "pago",
   "valor_total": 1990.0
  },
  {
   "id": 4,
   "cliente_id": 36,
   "data_pedido": "2025-03-11",
   "status": "pago",
   "valor_total": 665.0
  },
  {
   "id": 5,
   "cliente_id": 41,
   "data_pedido": "2025-04-08",
   "status": "enviado",
   "valor_total": 16300.0
  },
  {
   "id": 6,
   "cliente_id": 54,
   "data_pedido": "2025-04-11",
   "status": "novo",
   "valor_total": 8240.0
  },
  {
   "id": 7,
   "cliente_id": 29,
   "data_pedido": "2025-06-21",
   "status": "entregue",
   "valor_total": 180.0
  },
  {
   "id": 8,
   "cliente_id": 57,
   "data_pedido": "2025-07-26",
   "status": "cancelado",
   "valor_total": 10400.0
  },
  {
   "id": 9,
   "cliente_id": 38,
   "data_pedido": "2025-06-21",
   "status": "pago",
   "valor_total": 2090.0
  },
  {
   "id": 10,
   "cliente_id": 58,
   "data_pedido": "2025-05-02",
   "status": "pago",
   "valor_total": 800.0
  },
  {
   "id": 11,
   "cliente_id": 57,
   "data_pedido": "2025-05-15",
   "status": "cancelado",
   "valor_total": 960.0
  },
  {
   "id": 12,
   "cliente_id": 57,
   "data_pedido": "2025-05-16",
   "status": "novo",
   "valor_total": 12900.0
  },
  {
   "id": 13,
   "cliente_id": 18,
   "data_pedido": "2025-03-12",
   "status": "entregue",
   "valor_total": 480.0
  },
  {
   "id": 14,
   "cliente_id": 55,
   "data_pedido": "2025-05-31",
   "status": "pago",
   "valor_total": 13960.0
  },
  {
   "id": 15,
   "cliente_id": 26,
   "data_pedido": "2025-04-25",
   "status": "pago",
   "valor_total": 7600.0
  },
  {
   "id": 16,
   "cliente_id": 23,
   "data_pedido": "2025-07-14",
   "status": "enviado",
   "valor_total": 3760.0
  },
  {
   "id": 17,
   "cliente_id": 3,
   "data_pedido": "2025-02-27",
   "status": "pago",
   "valor_total": 0.0
  },
  {
   "id": 18,
   "cliente_id": 8,
   "data_pedido": "2025-05-09",
   "status": "entregue",
   "valor_total": 4990.0
  },
  {
   "id": 19,
   "cliente_id": 1,
   "data_pedido": "2025-06-13",
   "status": "cancelado",
   "valor_total": 1650.0
  },
  {
   "id": 20,
   "cliente_id": 59,
   "data_pedido": "2025-04-25",
   "status": "entregue",
   "valor_total": 70.0
  }
 ],
 "defeitos": [
  {
   "id": 1,
   "titulo": "[checkout] erro ao salvar lista",
   "modulo": "checkout",
   "severidade": "media",
   "status": "aberto",
   "ambiente": "producao"
  },
  {
   "id": 2,
   "titulo": "[busca] erro ao exibir lista",
   "modulo": "busca",
   "severidade": "critica",
   "status": "em_analise",
   "ambiente": "producao"
  },
  {
   "id": 3,
   "titulo": "[busca] erro ao exibir campo",
   "modulo": "busca",
   "severidade": "baixa",
   "status": "fechado",
   "ambiente": "producao"
  },
  {
   "id": 4,
   "titulo": "[checkout] erro ao carregar total",
   "modulo": "checkout",
   "severidade": "alta",
   "status": "fechado",
   "ambiente": "dev"
  },
  {
   "id": 5,
   "titulo": "[carrinho] erro ao calcular filtro",
   "modulo": "carrinho",
   "severidade": "alta",
   "status": "fechado",
   "ambiente": "homolog"
  },
  {
   "id": 6,
   "titulo": "[pagamento] erro ao exibir filtro",
   "modulo": "pagamento",
   "severidade": "baixa",
   "status": "aberto",
   "ambiente": "homolog"
  },
  {
   "id": 7,
   "titulo": "[pagamento] erro ao calcular total",
   "modulo": "pagamento",
   "severidade": "baixa",
   "status": "resolvido",
   "ambiente": "producao"
  },
  {
   "id": 8,
   "titulo": "[perfil] erro ao salvar filtro",
   "modulo": "perfil",
   "severidade": "media",
   "status": "em_analise",
   "ambiente": "homolog"
  },
  {
   "id": 9,
   "titulo": "[carrinho] erro ao validar campo",
   "modulo": "carrinho",
   "severidade": "baixa",
   "status": "em_analise",
   "ambiente": "dev"
  },
  {
   "id": 10,
   "titulo": "[perfil] erro ao calcular filtro",
   "modulo": "perfil",
   "severidade": "critica",
   "status": "aberto",
   "ambiente": "producao"
  },
  {
   "id": 11,
   "titulo": "[perfil] erro ao calcular total",
   "modulo": "perfil",
   "severidade": "baixa",
   "status": "aberto",
   "ambiente": "dev"
  },
  {
   "id": 12,
   "titulo": "[login] erro ao exibir filtro",
   "modulo": "login",
   "severidade": "baixa",
   "status": "fechado",
   "ambiente": "homolog"
  },
  {
   "id": 13,
   "titulo": "[perfil] erro ao validar sessao",
   "modulo": "perfil",
   "severidade": "media",
   "status": "resolvido",
   "ambiente": "producao"
  },
  {
   "id": 14,
   "titulo": "[login] erro ao calcular lista",
   "modulo": "login",
   "severidade": "baixa",
   "status": "resolvido",
   "ambiente": "producao"
  },
  {
   "id": 15,
   "titulo": "[checkout] erro ao validar filtro",
   "modulo": "checkout",
   "severidade": "alta",
   "status": "reaberto",
   "ambiente": "homolog"
  }
 ]
};
