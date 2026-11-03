"""Offline transcript/timing regressions for WEB-1 and EVAL-7. No generation."""
import importlib.util
from pathlib import Path
import sys
import unittest

SPEC = importlib.util.spec_from_file_location('align_higgsfield', Path(__file__).with_name('align-higgsfield.py'))
ALIGN = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = ALIGN
SPEC.loader.exec_module(ALIGN)


def asr(words):
    return {'transcription': [{'tokens': [{'text': ('' if text.startswith(('.', ',', '%')) else ' ') + text, 'offsets': {'from': start, 'to': end}} for text, start, end in words]}]}


class AlignmentTests(unittest.TestCase):
    def test_eval_7_numbers_brand_and_hyphens_map_to_real_token_bounds(self):
        result = ALIGN.align_words(['ShowMe hits 89.9 percent of 1,172 held-out examples.'], asr([
            ('Show', 100, 250), ('Me', 250, 400), ('hits', 410, 600), ('89', 610, 800), ('.9', 800, 950),
            ('%', 960, 1100), ('of', 1110, 1200), ('1172', 1210, 1800), ('held', 1810, 2000), ('out', 2000, 2150), ('examples.', 2160, 2400)]))
        self.assertEqual(result[0][0]['text'], 'ShowMe')
        self.assertEqual((result[0][0]['start'], result[0][0]['end']), (0.1, 0.4))
        self.assertEqual((result[0][2]['start'], result[0][2]['end']), (0.61, 0.95))
        self.assertEqual(result[0][-2]['text'], 'held-out')
        self.assertEqual((result[0][-2]['start'], result[0][-2]['end']), (1.81, 2.15))

    def test_eval_7_spoken_number_forms_preserve_the_approved_numeric_text(self):
        result = ALIGN.align_words(['1,172 examples at 89.9 percent.'], asr([
            ('one', 100, 200), ('thousand', 200, 400), ('one', 400, 500), ('hundred', 500, 650),
            ('and', 650, 700), ('seventy', 700, 850), ('two', 850, 1000), ('examples', 1010, 1300),
            ('at', 1310, 1400), ('eighty', 1410, 1550), ('nine', 1550, 1650), ('point', 1650, 1750), ('nine', 1750, 1900), ('percent.', 1910, 2200)]))
        self.assertEqual(result[0][0]['text'], '1,172')
        self.assertEqual(result[0][0]['end'], 1.0)

    def test_eval_7_never_hides_wrong_words_or_numbers(self):
        for spoken in ['89.8', '899']:
            with self.assertRaisesRegex(ALIGN.AlignmentError, 'transcript mismatch'):
                ALIGN.align_words(['89.9 percent.'], asr([(spoken, 0, 500), ('percent', 510, 800)]))
        with self.assertRaisesRegex(ALIGN.AlignmentError, 'transcript mismatch'):
            ALIGN.align_words(['Private by design.'], asr([('Safe', 0, 300), ('by', 310, 400), ('design.', 410, 800)]))

    def test_web_1_pause_boundaries_trim_verified_silence_only(self):
        paragraphs = [[{'text': 'First.', 'start': 0.2, 'end': 0.8}], [{'text': 'Second.', 'start': 2.0, 'end': 2.7}]]
        plan = ALIGN.plan_segments(paragraphs, [(0, 0.15), (0.9, 1.9), (2.8, 3.2)], 3.2, [2, 2])
        self.assertEqual(plan[0]['source_start'], 0.12)
        self.assertEqual(plan[0]['source_end'], 0.9)
        self.assertEqual(plan[1]['source_start'], 1.9)
        self.assertEqual(plan[1]['source_end'], 2.8)
        self.assertGreaterEqual(plan[0]['duration'], 0.6)
        self.assertEqual(plan[1]['cues'][0]['text'], 'Second.')

    def test_web_1_no_verified_paragraph_gap_requires_review(self):
        paragraphs = [[{'text': 'First.', 'start': 0.1, 'end': 1.0}], [{'text': 'Second.', 'start': 1.02, 'end': 2.0}]]
        with self.assertRaisesRegex(ALIGN.AlignmentError, 'verified silence'):
            ALIGN.plan_segments(paragraphs, [], 2.1, [2, 2])

    def test_web_1_overruns_report_every_segment_without_truncation(self):
        paragraphs = [[{'text': 'First.', 'start': 0.1, 'end': 2.0}], [{'text': 'Second.', 'start': 3.0, 'end': 5.0}]]
        with self.assertRaises(ALIGN.OverrunError) as error:
            ALIGN.plan_segments(paragraphs, [(2.1, 2.9)], 5.2, [1, 1])
        self.assertEqual(len(error.exception.overruns), 2)
        self.assertGreater(error.exception.overruns[0]['overrun_seconds'], 1)

    def test_web_1_caption_cues_use_speech_times_and_preserve_every_word(self):
        words = [{'text': 'One', 'start': 1.0, 'end': 1.2}, {'text': 'two', 'start': 1.4, 'end': 1.6}, {'text': 'three.', 'start': 2.0, 'end': 2.3}]
        cues = ALIGN.caption_cues(words, 0.8)
        self.assertAlmostEqual(cues[0]['start'], 0.2)
        self.assertAlmostEqual(cues[-1]['end'], 1.5)
        self.assertEqual(' '.join(c['text'] for c in cues), 'One two three.')

    def test_eval_7_unapproved_word_boundary_changes_require_review(self):
        with self.assertRaisesRegex(ALIGN.AlignmentError, 'transcript mismatch'):
            ALIGN.align_words(['Now here.'], asr([('Nowhere.', 100, 500)]))

    def test_eng_4_cache_identity_binds_both_raw_and_approved_transcript(self):
        first = ALIGN.work_directory('film', 'a' * 64, 'b' * 64)
        self.assertNotEqual(first, ALIGN.work_directory('film', 'c' * 64, 'b' * 64))
        self.assertNotEqual(first, ALIGN.work_directory('film', 'a' * 64, 'd' * 64))
        self.assertEqual(first, ALIGN.work_directory('film', 'a' * 64, 'b' * 64))

    def test_web_1_pause_edits_only_remove_detected_interword_silence(self):
        words = [{'text': 'One', 'start': 0.1, 'end': 0.8}, {'text': 'two.', 'start': 1.8, 'end': 2.2}]
        cuts = ALIGN.pause_edits(words, [(0.9, 1.7)], 0.5)
        self.assertEqual(len(cuts), 1)
        self.assertAlmostEqual(cuts[0]['end'] - cuts[0]['start'], 0.5)
        self.assertGreaterEqual(cuts[0]['start'], 0.96)
        self.assertLessEqual(cuts[0]['end'], 1.64)
        with self.assertRaisesRegex(ALIGN.AlignmentError, 'verified inter-word silence'):
            ALIGN.pause_edits(words, [(0.3, 0.6)], 0.1)

    def test_web_1_caption_remapping_is_piecewise_source_time_not_word_proportions(self):
        cuts = [{'start': 1.0, 'end': 1.5}, {'start': 3.0, 'end': 3.2}]
        self.assertAlmostEqual(ALIGN.remap_time(0.8, 0.2, cuts), 0.6)
        self.assertAlmostEqual(ALIGN.remap_time(1.4, 0.2, cuts), 0.8)
        self.assertAlmostEqual(ALIGN.remap_time(2.5, 0.2, cuts), 1.8)
        self.assertAlmostEqual(ALIGN.remap_time(4.0, 0.2, cuts), 3.1)
        self.assertEqual(ALIGN.retained_intervals(0.2, 4.0, cuts), [(0.2, 1.0), (1.5, 3.0), (3.2, 4.0)])

    def test_web_1_approved_x_slots_preserve_total_and_pause_limits(self):
        self.assertEqual(ALIGN.DURATIONS['x'], [7.4, 8.4, 8.2, 5.6, 11.82, 3.18])
        self.assertAlmostEqual(sum(ALIGN.DURATIONS['x']), 44.6)
        words = [[{'text': 'One', 'start': 0.1, 'end': 0.8}, {'text': 'two.', 'start': 1.8, 'end': 2.2}]]
        plan = ALIGN.plan_segments(words, [(0.9, 1.7)], 2.3, [2.0], pause_limits={0: 0.45})
        self.assertAlmostEqual(plan[0]['duration'] + 0.15, 2.0)
        self.assertEqual(' '.join(x['text'] for x in plan[0]['cues']), 'One two.')
        self.assertAlmostEqual(plan[0]['cues'][-1]['end'], 1.75)

    def test_web_1_approved_film_transfer_keeps_exact_180_and_frame_boundaries(self):
        self.assertEqual(ALIGN.DURATIONS['film'], [18.3, 28, 31.7, 34, 21, 34, 13])
        self.assertAlmostEqual(sum(ALIGN.DURATIONS['film']), 180)
        for value in ALIGN.DURATIONS['film']:
            self.assertAlmostEqual(value * 30, round(value * 30))


if __name__ == '__main__':
    unittest.main()
