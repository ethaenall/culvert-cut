import unittest
from eval_hallucination import emitted_ids,unknown_ids
class IdentifierTests(unittest.TestCase):
 def test_explicit(self):self.assertIn('999999',emitted_ids('Site 999999 is a barrier.'))
 def test_bare(self):self.assertIn('999999',emitted_ids('Try 999999 instead.'))
 def test_bracket(self):self.assertIn('AB123',emitted_ids('[AB123]'))
 def test_coordinates(self):self.assertNotIn('122',emitted_ids('47.12345, -122.012345'))
 def test_id_extension_is_not_masked(self):
  self.assertIn('9201219',unknown_ids('Site 9201219 is total. [920121]', '920121'))
 def test_exact_spaced_id_is_allowed(self):
  self.assertEqual(set(),unknown_ids('Site 102 L060 is partial. [102 L060]', '102 L060'))
 def test_prefixed_invention_is_not_masked(self):
  self.assertIn('FAKE920121',unknown_ids('Site FAKE920121 is total.', '920121'))
if __name__=='__main__':unittest.main()
