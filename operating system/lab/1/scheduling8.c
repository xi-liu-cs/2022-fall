#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>
#define file FILE
#define end_file EOF
#define null NULL
#define true 1
#define false 0
int block = 32;

int int_ceil(double a)
{
  int int_a = (int)a;
  if(a == (double)int_a)
    return int_a;
  else
    return int_a + 1;
}

void * mal(size_t size)
{
    if(!size)
      size = 1;
    printf("size = %ld\n", size);
    void * a = malloc(size);
    if(!a)
      printf("malloc error, size = %ld\n", size);
    return a;
}

void * rea(void * ptr, size_t size)
{
    if(!size)
      size = 1;
    void * a = realloc(ptr, size);
    if(!a)
      printf("realloc error, size = %ld\n", size);
    return a;
}

enum proc_state {initial, running, ready, blocked, final};
typedef struct
{
  int pid, cpu, io, arrival, 
  cpu_remain, io_remain, half_cpu, finish_time;
  enum proc_state state;
}proc;

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

void vec_free(vec * v)
{
  free(v->a);
  free(v);
}

void vec_push(vec * v, proc * data)
{
    if(v->cur == v->cap)
    {
        v->cap *= 2;
        v->a = (proc **)rea(v->a, v->cap * sizeof(proc *));
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

#define queue_link_is_empty(q)(!q || !q->front)
#define queue_link_is_size_greater_than_1(q)(q->front != q->back)

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

void queue_link_free(queue_link * q)
{
  if(!q || !q->front)
    return;
  node * pre = q->front,
  * cur = q->front;
  while(cur->next != q->front)
  {
    pre = cur;
    cur = cur->next;
    free(pre);
  }
  free(cur);
  free(q);
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
    queue_link * vec_queue = vec_to_queue_link(v);
    vec_free(v);
    return vec_queue;
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

#define front(q)(q->a[q->front])
#define back(q)(q->a[q->back])
#define is_empty(q)(!q->cur)

typedef struct
{
    proc ** a;
    int front, back, cap, cur;
}queue;

queue * queue_malloc(int n)
{
    queue * q = (queue *)mal(sizeof(queue));
    q->front = 0;
    q->back = -1;
    if(n <= 0)
      q->cap = 1;
    else
      q->cap = n;
    q->a = (proc **)mal(q->cap * sizeof(proc *));
    q->cur = 0;
    return q;
}

void push(queue * q, proc * val)
{
    if(q->cur == q->cap)
    {
        q->cap *= 2;
        q->a = (proc **)rea(q->a, q->cap * sizeof(proc *));
    }
    q->back = (q->back + 1) % q->cap;
    q->a[q->back] = val;
    ++q->cur;
}

void pop(queue * q)
{
    if(q->cur)
    {
      q->front = (q->front + 1) % q->cap;
      --q->cur;
    }
}

void print_queue(queue * q)
{
    for(int i = 0; i < q->cur; ++i)
        printf("%d ", q->a[(q->front + i) % q->cap]->pid);
}

void free_queue(queue * q)
{
    free(q->a);
    free(q);
}

/* store the entire file into an array of char pointers 
fp: file pointer
num_line: address of variable that would store number of lines */
char ** file_to_array(file * fp, int * num_line)
{
    int cur = block;
    char ** lines = (char **)mal(cur * sizeof(char *));
    *num_line = 0;
    char * line = null;
    size_t len = 0;
    ssize_t nread;
    while((nread = getline(&line, &len, fp)) != end_file) 
    {
        if(*num_line >= cur)
        {
          cur += block;
          lines = (char **)rea(lines, cur * sizeof(char *));
        }
        if('0' <= *line && *line <= '9')
        {
          size_t sz = nread * sizeof(char);
          char * line_buf = (char *)mal(sz);
          memcpy(line_buf, line, sz);
          lines[(*num_line)++] = line_buf;
        }
    }
    free(line);
    return lines;
}

void free_file_to_array(char ** a, int n)
{
  for(int i = 0; i < n; ++i)
    free(a[i]);
  free(a);
}

/* print the contents of the array of char pointers */
void print_lines(char ** lines, int num_line)
{
    for(int i = 0; i < num_line; ++i)
      printf("%s", lines[i]);
    printf("\n");
}

/* convert the array of character pointers to array of integers */
int * split(char ** lines, int num_line, int num_int)
{
    int * num_array = (int *)mal((num_int + 1) * sizeof(int));
    int num_array_i = 0;
    for(int i = 0; i < num_line; ++i)
    {
        if(num_array_i >= num_int + 1)
          break;
        char * a = lines[i];
        char * ptr  = a;
        char * end = ptr;
        while(*end && *end != '\t' && *end != '\r' && *end != '\n' && *end != '\a') /* \t = tab, \r = carriage return, \n = newline, \a = alert */
        {
            num_array[num_array_i++] = strtol(ptr, &end, 10); 
            ptr = end;
        }
    }
    return num_array;
}

/* print array of integers */
void print_int(int * a, int len)
{
    for(int i = 0; i < len; ++i)
        printf("%d ", a[i]);
    printf("\n");
}

#define is_ready(p, cycle)(p->arrival <= cycle && p->cpu_remain > 0)
#define swap(a, i, j){proc * t = a[i]; a[i] = a[j]; a[j] = t;}

proc ** queue_to_proc_array(queue * q)
{
  proc ** a = (proc **)mal(q->cur * sizeof(proc *));
  for(int i = 0; i < q->cur; ++i)
    a[i] = q->a[(q->front + i) % q->cap];
  return a;
}

queue * proc_array_to_queue(proc ** p, int n)
{
  queue * q = (queue *)mal(sizeof(queue));
  size_t sz = n * sizeof(proc *);
  q->a = (proc **)mal(sz);
  memcpy(q->a, p, sz);
  q->front = 0;
  q->back = n - 1;
  if(n <= 0)
    q->cap = 1;
  else
    q->cap = n;
  q->cur = n;
  return q;
}

int compare_pid(const void * p1, const void * p2)
{
  return (*(proc **)p1)->pid - (*(proc **)p2)->pid;
}

queue * sort_queue(queue * q, int (*compare)(const void *, const void *))
{
    proc ** proc_array = queue_to_proc_array(q);
    int proc_array_len = q->cur;
    qsort(proc_array, proc_array_len, sizeof(proc *), compare);
    return proc_array_to_queue(proc_array, proc_array_len);
}

void fprint_proc(file * fp, proc ** proc_array, int n_proc, int cycle)
{
  qsort(proc_array, n_proc, sizeof(proc *), compare_pid);
  fprintf(fp, "%d ", cycle);
  for(int i = 0; i < n_proc; ++i)
  {
    proc * p = proc_array[i];
    if(p->state == running)
      fprintf(fp, "%d:running ", p->pid);
    else if(p->state == ready)
      fprintf(fp, "%d:ready ", p->pid);
    else if(p->state == blocked)
      fprintf(fp, "%d:blocked ", p->pid);
  }
  fprintf(fp, "\n");
}

void fprint_proc2(file * fp, proc ** proc_array, int n_proc, int cycle, int cpu_work)
{
  fprintf(fp, "\n");
  fprintf(fp, "Finishing time: %d\n", cycle - 1);
  fprintf(fp, "CPU utilization: %.2f\n", (float)cpu_work / cycle);
  for(int i = 0; i < n_proc; ++i)
  {
    proc * p = proc_array[i];
    fprintf(fp, "Turnaround process %d: %d\n", p->pid, p->finish_time - p->arrival + 1);
  }
}

void first_come_first_served(file * fp_out, proc ** proc_array, int n_proc)
{
  queue_link * q = queue_link_malloc(); /* queue of ready processes */
  int finish = 0, /* count of currently finished processes */
  cycle = 0,
  cpu_work = 0;
  proc * cur_run = null; /* current running process */
  while(finish < n_proc)
  {
    printf("first_come_first_served_queue_link_malloc\n");
    queue_link * q_cur_cycle = queue_link_malloc(); /* processes that become ready this cycle */
    for(int i = 0; i < n_proc && finish < n_proc; ++i)
    {
      proc * p = proc_array[i];
      if(p->state == initial && is_ready(p, cycle))
      {
        p->state = ready;
        queue_link_push(q_cur_cycle, p);
      }
      else if(p->state == running && p->cpu_remain > 0)
      {
        --p->cpu_remain; 
        ++cpu_work;
        if(p->cpu_remain <= p->half_cpu && p->io_remain > 0)
        {
          p->state = blocked;
          cur_run = null;
        }
        else if(!p->cpu_remain && !p->io_remain)
        {
          p->state = final;
          p->finish_time = cycle - 1;
          cur_run = null;
          ++finish;
          if(finish == n_proc)
            break;
        }
      }
      else if(p->state == blocked && p->io_remain > 0)
      {
        --p->io_remain;
        if(!p->io_remain && p->cpu_remain > 0) /* when a process is blocked for i/o, and then ready, added to queue */
        {
          p->state = ready;
          queue_link_push(q_cur_cycle, p);
        }
      }
    }
    if(finish == n_proc)
      break;
    if(!queue_link_is_empty(q_cur_cycle))
    {
      if(queue_link_is_size_greater_than_1(q_cur_cycle))
      {
        queue_link * q_cur_cycle2 = sort_queue_link(q_cur_cycle, compare_pid);
        queue_link_free(q_cur_cycle);
        q_cur_cycle = q_cur_cycle2;
      }
      q = queue_link_combine(q, q_cur_cycle);
    }
    if(!queue_link_is_empty(q) && !cur_run)
    {
      cur_run = q->front->p;
      cur_run->state = running;
      queue_link_pop(q);
    }
    if(queue_link_is_empty(q_cur_cycle))
      queue_link_free(q_cur_cycle);
    fprint_proc(fp_out, proc_array, n_proc, cycle);
    ++cycle;
  }
  fprint_proc2(fp_out, proc_array, n_proc, cycle, cpu_work);
  queue_link_free(q);
}

void round_robin(file * fp_out, proc ** proc_array, int n_proc, int quantum)
{
  queue_link * q = queue_link_malloc(); /* queue of ready processes */
  int finish = 0, /* count of currently finished processes */
  cycle = 0,
  cpu_work = 0,
  cur_quant = 0; /* time that the current process already ran */
  proc * cur_run = null; /* current running process */
  while(finish < n_proc)
  {
    queue_link * q_cur_cycle = queue_link_malloc(); /* processes that become ready this cycle */
    for(int i = 0; i < n_proc && finish < n_proc; ++i)
    {
      proc * p = proc_array[i];
      if(p->state == initial && is_ready(p, cycle))
      {
        p->state = ready;
        queue_link_push(q_cur_cycle, p);
      }
      else if(p->state == running && p->cpu_remain > 0)
      {
        --p->cpu_remain; 
        ++cpu_work;
        ++cur_quant;
        if(cur_quant == quantum && p->cpu_remain > 0)
        {/* current process ran for quantum cycles */
          if(p->cpu_remain <= p->half_cpu && p->io_remain > 0)
            p->state = blocked;
          else
          {
            p->state = ready;
            queue_link_push(q_cur_cycle, p);
          }
          cur_quant = 0;
          cur_run = null;
        }
        else if(p->cpu_remain <= p->half_cpu && p->io_remain > 0)
        {/* current process is blocked on i/o */
          p->state = blocked;
          cur_run = null;
          if(cur_quant == quantum)
            cur_quant = 0;
        }
        else if(!p->cpu_remain && !p->io_remain)
        {/* current running process terminates */
          p->state = final;
          p->finish_time = cycle - 1;
          cur_run = null;
          ++finish;
          if(finish == n_proc)
            break;
        }
      }
      else if(p->state == blocked && p->io_remain > 0)
      {
        --p->io_remain;
        if(!p->io_remain && p->cpu_remain > 0) /* when a process is blocked for i/o, and then ready, added to queue */
        {
          p->state = ready;
          queue_link_push(q_cur_cycle, p);
        }
      }
    }
    if(finish == n_proc)
      break;
    if(!queue_link_is_empty(q_cur_cycle))
    {
      if(queue_link_is_size_greater_than_1(q_cur_cycle))
      {
        queue_link * q_cur_cycle2 = sort_queue_link(q_cur_cycle, compare_pid);
        queue_link_free(q_cur_cycle);
        q_cur_cycle = q_cur_cycle2;
      }
      q = queue_link_combine(q, q_cur_cycle);
    }
    if(!queue_link_is_empty(q) && !cur_run)
    {
      cur_run = q->front->p;
      cur_run->state = running;
      queue_link_pop(q);
    }
    if(queue_link_is_empty(q_cur_cycle))
      queue_link_free(q_cur_cycle);
    fprint_proc(fp_out, proc_array, n_proc, cycle);
    ++cycle;
  }
  fprint_proc2(fp_out, proc_array, n_proc, cycle, cpu_work);
  queue_link_free(q);
}

/* if several processes have same remaining cpu time, give preference to process with lower id */
void same_cpu_remain_handler(queue * q)
{
  proc * prev = front(q);
  proc * cur = q->a[(q->front + 1) % q->cap];
  int min_i = q->front;
  for(int i = 1; i < q->cur - 1 && prev->cpu_remain == cur->cpu_remain; ++i)
  {
    int prev_i = (q->front + i) % q->cap,
    cur_i = (q->front + i + 1) % q->cap;
    prev = q->a[prev_i];
    cur = q->a[cur_i];
    if(cur->pid < ((proc *)q->a[min_i])->pid)
      min_i = cur_i;
  }
  swap(q->a, q->front, min_i);
}

int compare_cpu_remain(const void * p1, const void * p2)
{
  return (*(proc **)p1)->cpu_remain - (*(proc **)p2)->cpu_remain;
}

void shortest_remaining_job_first(file * fp_out, proc ** proc_array, int n_proc)
{
  queue * q = queue_malloc(n_proc); /* queue of ready/running processes */
  int finish = 0, /* count of currently finished processes */
  cycle = 0,
  cpu_work = 0;
  proc * cur_run = null; /* current running process */
  while(finish < n_proc)
  {
    for(int i = 0; i < n_proc && finish < n_proc; ++i)
    {
      proc * p = proc_array[i];
      if(p->state == initial && is_ready(p, cycle))
      {
        p->state = ready;
        push(q, p);
      }
      else if(p->state == running && p->cpu_remain > 0)
      {
        --p->cpu_remain; 
        ++cpu_work;
        if(p->cpu_remain <= p->half_cpu && p->io_remain > 0)
        {
          p->state = blocked;
          pop(q);
        }
        else if(!p->cpu_remain && !p->io_remain)
        {
          p->state = final;
          p->finish_time = cycle - 1;
          pop(q); /* remove previously running process from queue */
          ++finish;
          if(finish == n_proc)
            break;
        }
      }
      else if(p->state == blocked && p->io_remain > 0)
      {
        --p->io_remain;
        if(!p->io_remain && p->cpu_remain > 0) /* when a process is blocked for i/o, and then ready, added to queue */
        {
          p->state = ready;
          push(q, p);
        }
      }
    }  
    if(finish == n_proc)
      break;
    queue * q2 = sort_queue(q, compare_cpu_remain);
    free_queue(q);
    q = q2;
    same_cpu_remain_handler(q);
    if(!is_empty(q))
    {
      if(cur_run && cur_run->state == running)
        cur_run->state = ready;
      cur_run = front(q);
      cur_run->state = running;
    }
    fprint_proc(fp_out, proc_array, n_proc, cycle);
    ++cycle;
  }
  fprint_proc2(fp_out, proc_array, n_proc, cycle, cpu_work);
  free_queue(q);
}

int main(int argc, char ** argv)
{  
  int scheduling;
  file * fp_in; /* input */
  char * filename;
  if(argc != 3)
  {
    printf("usage:  ./scheduling alg input\n");
    printf("alg: the scheduling algorithm: 0, 1, or 2\n");
    printf("input: the processes input file\n");
    exit(1);
  }
  scheduling = (int)atoi(argv[1]); /* scheduling algorithm */
  if(!(fp_in = fopen(argv[2], "r")))
  {/* check that file specified by user exists and open it */
    printf("cannot open file %s\n", argv[2]);
    exit(1);
  }
  size_t file_len = strlen(argv[2]) + 3; /* "%d-%s\0", %d in {0, 1, 2} */
  filename = (char *)mal(file_len * sizeof(char));
  sprintf(filename, "%d-%s", scheduling, argv[2]); /* form output file name */
  int num_line = 0;
  char ** lines = file_to_array(fp_in, &num_line); /* print_lines(lines, num_line); */
  printf("print_lines\n");
  print_lines(lines, num_line);
  int n_proc = atoi(*lines),
  n_int = n_proc * 4 + 1;
  int * int_array = split(lines, num_line, n_int); /* print_int(int_array, n_int); */
  printf("print_int\n");
  print_int(int_array, n_int);
  free_file_to_array(lines, num_line);
  proc * proc_array[n_proc];
  int * int_ptr = int_array + 1;
  printf("int_ptr\n");
  for(int i = 0; i < n_proc; ++i)
  {
    for(int j = 0; j < 4; ++j)
      printf("%d ", int_ptr[i * 4 + j]);
    printf("\n");
  }
  for(int i = 0; i < n_proc; ++i)
  {
    proc p = 
    {
      int_ptr[i * 4], int_ptr[i * 4 + 1], int_ptr[i * 4 + 2], int_ptr[i * 4 + 3],
      int_ptr[i * 4 + 1], int_ptr[i * 4 + 2], int_ceil((double)int_ptr[i * 4 + 1] / 2), -1, initial
    };
    proc_array[i] = (proc *)mal(sizeof(proc));
    memcpy(proc_array[i], &p, sizeof(proc));
  } /* for(int i = 0; i < n_proc; ++i) printf("pid = %d, cpu = %d, io = %d, arrival = %d, cpu_remain = %d, io_remain = %d, "
      "half_cpu = %d, finish_time = %d, state = %d\n", proc_array[i]->pid, proc_array[i]->cpu, proc_array[i]->io, proc_array[i]->arrival,
      proc_array[i]->cpu_remain, proc_array[i]->io_remain, proc_array[i]->half_cpu, proc_array[i]->finish_time, proc_array[i]->state); */
  for(int i = 0; i < n_proc; ++i) printf("pid = %d, cpu = %d, io = %d, arrival = %d, cpu_remain = %d, io_remain = %d, "
      "half_cpu = %d, finish_time = %d, state = %d\n", proc_array[i]->pid, proc_array[i]->cpu, proc_array[i]->io, proc_array[i]->arrival,
      proc_array[i]->cpu_remain, proc_array[i]->io_remain, proc_array[i]->half_cpu, proc_array[i]->finish_time, proc_array[i]->state);
  free(int_array);
  qsort(proc_array, n_proc, sizeof(proc *), compare_pid);
  file * fp_out = fopen(filename, "w+");
  if(!scheduling)
    first_come_first_served(fp_out, proc_array, n_proc);
  if(scheduling == 1)
    round_robin(fp_out, proc_array, n_proc, 2);
  if(scheduling == 2)
    shortest_remaining_job_first(fp_out, proc_array, n_proc);
  for(int i = 0; i < n_proc; ++i)
    free(proc_array[i]);
  fclose(fp_in); /* close processes file */
  fclose(fp_out);
  return 0;
}