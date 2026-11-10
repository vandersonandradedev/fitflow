-- Banco separado para testes de integração (isolamento multi-tenant).
-- Executado apenas na primeira inicialização do volume.
CREATE DATABASE fitflow_test OWNER fitflow;
