import unittest
try:
 from fastapi.testclient import TestClient
 import server
except ImportError:
 server=None
@unittest.skipIf(server is None,'Optional API dependencies not installed')
class APITests(unittest.TestCase):
 def setUp(self):self.client=TestClient(server.app);self.before=server.model
 def tearDown(self):server.model=self.before
 def test_named_creek_retrieval_excludes_generic_creek_matches(self):
  sites,_=server.retrieve('Explain Zackuse Creek',{});self.assertTrue(sites);self.assertTrue(all('zackuse' in (s['stream']+' '+s['road']).lower() for s in sites))
 def test_empty_refuses(self):
  r=self.client.post('/api/ask',json={'question':'Martian weather'});self.assertEqual(r.status_code,200);self.assertIn("don't know",r.json()['sentences'][0]['text'])
 def test_client_fields_are_not_evidence(self):
  sites,_=server.retrieve('Explain this site',{'sites':[{'properties':{'id':'920121','owner':'Invented'}}]});self.assertNotEqual(sites[0]['owner'],'Invented')
 def test_invented_model_output_is_rejected(self):
  class Fake:
   adapter_loaded=True
   def answer(self,*a):return 'Site 999999 is perfectly safe. [920121]'
  server.model=Fake();r=self.client.post('/api/ask',json={'question':'Explain 920121'}).json();self.assertIn('rejected',r['mode']);self.assertNotIn('999999',str(r['sentences']))
 def test_exact_supported_sentence_is_accepted(self):
  class Fake:
   adapter_loaded=True
   def answer(self,q,c):
    s=c['supportedSentences'][0];return s['text']+' ['+s['cite']+']'
  server.model=Fake();r=self.client.post('/api/ask',json={'question':'Explain 920121'}).json();self.assertIn('adapter loaded',r['mode']);self.assertEqual(r['sentences'][0]['cite'],'920121')
 def test_audit_unknown_site_refuses_before_model(self):
  r=self.client.post('/api/audit',json={'siteId':'NOT_IN_INVENTORY','claim':'It is passable.'});self.assertEqual(r.status_code,404)
 def test_audit_does_not_accept_wrong_citation(self):
  class Fake:
   adapter_loaded=True
   def answer(self,*a):return '{"verdict":"supported","reason":"Invented","citations":["999999"]}'
  server.model=Fake();r=self.client.post('/api/audit',json={'siteId':'920121','claim':'It is passable.'}).json();self.assertIsNone(r['parsed']);self.assertFalse(r['citationCheck']);self.assertIn('999999',r['raw'])
if __name__=='__main__':unittest.main()
