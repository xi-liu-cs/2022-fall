#include <stdio.h>
#include <stdlib.h>
#define front(q)(q->a[q->front])
#define back(q)(q->a[q->back])

typedef struct
{
    void ** a;
    int front, back, cap, cur;
}queue;

queue * queue_malloc(int n)
{
    queue * q = (queue *)malloc(sizeof(queue));
    q->a = (void **)malloc(n * sizeof(void *));
    q->front = 0;
    q->back = -1;
    q->cap = n;
    q->cur = 0;
    return q;
}

void push(queue * q, void * val)
{
    if(q->cur >= q->cap)
    {
        q->cap *= 2;
        q->a = (void **)realloc(q->a, q->cap * sizeof(void *));
    }
    q->back = (q->back + 1) % q->cap;
    q->a[q->back] = val;
    ++q->cur;
}

void pop(queue * q)
{
    q->front = (q->front + 1) % q->cap;
    --q->cur;
}

void print(queue * q)
{
    for(int i = 0; i < q->cur; ++i)
        printf("%d ", *(int *)(q->a[(q->front + i) % q->cap]));
}

void free_queue(queue * q)
{
    free(q->a);
    free(q);
}
