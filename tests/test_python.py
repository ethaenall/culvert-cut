import unittest
from eval_hallucination import emitted_ids
class IdentifierTests(unittest.TestCase):
 def test_explicit(self):self.assertIn('999999',emitted_ids('Site 999999 is a barrier.'))
 def test_bare(self):self.assertIn('999999',emitted_ids('Try 999999 instead.'))
 def test_bracket(self):self.assertIn('AB123',emitted_ids('[AB123]'))
 def test_coordinates(self):self.assertNotIn('122',emitted_ids('47.12345, -122.012345'))
if __name__=='__main__':unittest.main()
