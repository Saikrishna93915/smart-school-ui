import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export type BuilderQuestionType =
  | 'mcq'
  | 'multi_select'
  | 'true_false'
  | 'short_answer'
  | 'long_answer'
  | 'fill_blank';

export interface BuilderQuestion {
  id: string;
  type: BuilderQuestionType;
  question: string;
  options: string[];
  correctAnswer: string | boolean;
  correctAnswers: number[];
  marks: number;
  expanded: boolean;
}

interface QuestionBuilderProps {
  questions: BuilderQuestion[];
  onAddQuestion: () => void;
  onRemoveQuestion: (id: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<BuilderQuestion>) => void;
  errors: Record<string, string>;
}

const QUESTION_TYPE_OPTIONS: Array<{ label: string; value: BuilderQuestionType }> = [
  { label: 'Multiple Choice (Single)', value: 'mcq' },
  { label: 'Multiple Select', value: 'multi_select' },
  { label: 'True / False', value: 'true_false' },
  { label: 'Short Answer', value: 'short_answer' },
  { label: 'Long Answer', value: 'long_answer' },
  { label: 'Fill in the Blank', value: 'fill_blank' },
];

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  questions,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Exam Questions</h3>
        <Button type="button" variant="outline" onClick={onAddQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground text-center">
          No questions added. Click Add Question to create the exam paper.
        </div>
      )}

      {questions.map((q, index) => {
        const prefix = `question_${q.id}`;
        const isObjective = q.type === 'mcq' || q.type === 'multi_select' || q.type === 'true_false' || q.type === 'fill_blank';

        return (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Question {index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onUpdateQuestion(q.id, { expanded: !q.expanded })}
                  >
                    {q.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => onRemoveQuestion(q.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {q.expanded && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(value) =>
                        onUpdateQuestion(q.id, {
                          type: value as BuilderQuestionType,
                          correctAnswer: value === 'true_false' ? true : '',
                          correctAnswers: [],
                          options: value === 'mcq' || value === 'multi_select' ? ['', '', '', ''] : q.options,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPE_OPTIONS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => onUpdateQuestion(q.id, { marks: Number(e.target.value) || 0 })}
                    />
                    {errors[`${prefix}_marks`] && (
                      <p className="text-xs text-destructive">{errors[`${prefix}_marks`]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    rows={3}
                    value={q.question}
                    onChange={(e) => onUpdateQuestion(q.id, { question: e.target.value })}
                    placeholder="Enter question text"
                  />
                  {errors[`${prefix}_question`] && (
                    <p className="text-xs text-destructive">{errors[`${prefix}_question`]}</p>
                  )}
                </div>

                {(q.type === 'mcq' || q.type === 'multi_select') && (
                  <div className="space-y-3">
                    <Label>Options</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => (
                        <Input
                          key={`${q.id}_opt_${optIdx}`}
                          value={opt}
                          onChange={(e) => {
                            const nextOptions = [...q.options];
                            nextOptions[optIdx] = e.target.value;
                            onUpdateQuestion(q.id, { options: nextOptions });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        />
                      ))}
                    </div>
                    {errors[`${prefix}_options`] && (
                      <p className="text-xs text-destructive">{errors[`${prefix}_options`]}</p>
                    )}
                  </div>
                )}

                {q.type === 'mcq' && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
                      onValueChange={(value) => onUpdateQuestion(q.id, { correctAnswer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        {q.options.map((opt, idx) => (
                          <SelectItem key={`${q.id}_ans_${idx}`} value={String(idx)}>
                            {`${String.fromCharCode(65 + idx)}. ${opt || '(empty option)'}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`${prefix}_correct`] && (
                      <p className="text-xs text-destructive">{errors[`${prefix}_correct`]}</p>
                    )}
                  </div>
                )}

                {q.type === 'multi_select' && (
                  <div className="space-y-2">
                    <Label>Correct Answers</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, idx) => (
                        <label key={`${q.id}_multi_${idx}`} className="flex items-center gap-2 rounded border p-2 cursor-pointer">
                          <Checkbox
                            checked={q.correctAnswers.includes(idx)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...q.correctAnswers, idx]
                                : q.correctAnswers.filter((val) => val !== idx);
                              onUpdateQuestion(q.id, { correctAnswers: next });
                            }}
                          />
                          <span className="text-sm">{`${String.fromCharCode(65 + idx)}. ${opt || '(empty option)'}`}</span>
                        </label>
                      ))}
                    </div>
                    {errors[`${prefix}_correct`] && (
                      <p className="text-xs text-destructive">{errors[`${prefix}_correct`]}</p>
                    )}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={String(q.correctAnswer)}
                      onValueChange={(value) => onUpdateQuestion(q.id, { correctAnswer: value === 'true' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(q.type === 'short_answer' || q.type === 'fill_blank') && (
                  <div className="space-y-2">
                    <Label>{q.type === 'fill_blank' ? 'Correct Answer' : 'Expected Answer (Optional)'}</Label>
                    <Input
                      value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
                      onChange={(e) => onUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                      placeholder={q.type === 'fill_blank' ? 'Enter correct answer' : 'Expected keyword/answer'}
                    />
                    {q.type === 'fill_blank' && errors[`${prefix}_correct`] && (
                      <p className="text-xs text-destructive">{errors[`${prefix}_correct`]}</p>
                    )}
                  </div>
                )}

                {!isObjective && q.type === 'long_answer' && (
                  <p className="text-xs text-muted-foreground">
                    Long answer questions do not require predefined correct answer.
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default QuestionBuilder;
