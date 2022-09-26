#include "proc.h"

typedef struct
{
    proc ** a;
    size_t cap, cur;
}vec;

vec * vec_malloc(int n)
{
    vec * v = (vec *)mal(sizeof(vec));
    if(n <= 0)
        v->cap = 1;
    else
        v->cap = n;
    v->a = (proc **)mal(v->cap * sizeof(proc *));
    v->cur = 0;
    return v;
}

void vec_push(vec * v, proc * data)
{
    if(v->cur == v->cap)
    {
        v->cap *= 2;
        v->a = (proc **)realloc(v->a, v->cap * sizeof(proc *));
    }
    v->a[v->cur++] = data;
}

typedef struct node
{
    proc * p;
    struct node * next;
}node;

typedef struct
{
    node * front, * back;
}queue_link;

queue_link * queue_link_malloc()
{
    queue_link * q = (queue_link *)mal(sizeof(queue_link));
    q->front = q->back = null;
    return q;
}

void queue_link_push(queue_link * q, proc * val)
{
    node * a = (node *)mal(sizeof(node));
    a->p = val;
    if(!q->front)
        q->front = a;
    else
        q->back->next = a;
    q->back = a;
    q->back->next = q->front;
}

void queue_link_pop(queue_link * q)
{
    if(!q->front)
        printf("empty\n");
    if(q->front == q->back)
    {
        free(q->front);
        q->front = null;
        q->back = null;
    }
    else
    {
        node * a = q->front;
        q->front = q->front->next;
        q->back->next = q->front;
        free(a);
    }
}

void queue_link_erase(queue_link * q, proc * p)
{
    if(!q || !q->front)
        return;
    node * pre = q->front,
    * cur = q->front;
    while(cur->p->pid != p->pid)
    {
        if(cur->next == q->front)
        {
            printf("not in list\n");
            break;
        }
        pre = cur;
        cur = cur->next;
    }
    if(cur->next == q->front)
    {
        q->front = null;
        free(cur);
        return;
    }
    if(cur == q->front)
    {
        pre = q->front;
        while(pre->next != q->front)
            pre = pre->next;
        q->front = cur->next;
        pre->next = q->front;
        free(cur);
    }
    else if(cur->next == q->front && cur == q->front)
    {
        pre->next = q->front;
        free(cur);
    }
    else
    {
        pre->next = cur->next;
        free(cur);
    }
}

vec * queue_link_to_vec(queue_link * q)
{
    if(!q || !q->front)
        return null;
    node * a = q->front;
    vec * v = vec_malloc(block);
    while(a->next != q->front)
    {
        vec_push(v, a->p);
        a = a->next;
    }
    vec_push(v, a->p);
    return v;
}

queue_link * vec_to_queue_link(vec * v)
{
    queue_link * q = queue_link_malloc();
    for(int i = 0; i < v->cur; ++i)
        queue_link_push(q, v->a[i]);
    return q;
}

queue_link * sort_queue_link(queue_link * q, int (*compare)(const void * p1, const void * p2))
{
    if(!q || !q->front)
        return null;
    vec * v = queue_link_to_vec(q);
    qsort(v->a, v->cur, sizeof(proc *), compare);
    return vec_to_queue_link(v);
}

void print_queue_link(queue_link * q)
{
    if(!q || !q->front)
        return;
    node * a = q->front;
    while(a->next != q->front)
    {
        printf("%d ", a->p->pid);
        a = a->next;
    }
    printf("%d ", a->p->pid);
}

queue_link * queue_link_combine(queue_link * q1, queue_link * q2)
{
    if(!q1 || !q1->front)
        return q2;
    if(!q2 || !q2->front)
        return q1;
    q1->back->next = q2->front;
    q2->back->next = q1->front;
    q1->back = q2->back;
    return q1;
}