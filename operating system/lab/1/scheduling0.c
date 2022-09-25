#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>
#define file FILE
#define end_file EOF
#define null NULL
int block = 128;

void * mal(size_t size)
{
    void * a = malloc(size);
    if(!a)
      printf("malloc error\n");
    return a;
}

void * rea(void * ptr, size_t size)
{
    void * a = realloc(ptr, size);
    if(!a)
      printf("realloc error\n");
    return a;
}

enum proc_state {initial, running, ready, blocked, final};
typedef struct
{
  int pid, cpu, io, arrival, 
  cpu_remain, io_remain, half_cpu, finish_time;
  enum proc_state state;
}proc;

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
    q->a = (proc **)mal(n * sizeof(proc *));
    q->front = 0;
    q->back = -1;
    q->cap = n;
    q->cur = 0;
    return q;
}

void push(queue * q, proc * val)
{
    printf("push %d\n", val->pid);
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
    printf("pop %d\n", q->front);
    q->front = (q->front + 1) % q->cap;
    --q->cur;
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
        char * end_ptr = lines[i];
        while(num_array_i < num_int + 1)
        {
            num_array[num_array_i++] = strtof(end_ptr, &end_ptr);
            if(isspace((int)end_ptr[1]))
                break;
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
#define swap(a, i, j){typeof(*a) t = a[i]; a[i] = a[j]; a[j] = t;}

int compare_pid(const void * p1, const void * p2)
{
  return (*(proc **)p1)->pid - (*(proc **)p2)->pid;
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

void first_come_first_serve(file * fp_out, proc ** proc_array, int n_proc)
{
  queue * q = queue_malloc(n_proc); /* queue of ready processes */
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
          push(q, p);
        }
      }
    }
    if(finish == n_proc)
      break;
    qsort(q->a, q->cur, sizeof(proc *), compare_pid);
    if(!cur_run)
    {
      cur_run = front(q);
      cur_run->state = running;
      pop(q);
    }
    fprint_proc(fp_out, proc_array, n_proc, cycle);
    ++cycle;
  }
  fprint_proc2(fp_out, proc_array, n_proc, cycle, cpu_work);
}

void round_robin(file * fp_out, proc ** proc_array, int n_proc, int quantum)
{
  queue * q = queue_malloc(n_proc); /* queue of ready processes */
  int finish = 0, /* count of currently finished processes */
  cycle = 0,
  cpu_work = 0,
  cur_quant = 0; /* time that the current process already ran */
  proc * cur_run = null; /* current running process */
  // while(finish < n_proc)
  while(cycle < 20)
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
        // printf("%d:running\n", p->pid);
        --p->cpu_remain; 
        ++cpu_work;
        ++cur_quant;
        if(p->cpu_remain <= p->half_cpu && p->io_remain > 0)
        {
          // printf("cpu_rem = %d, half = %d, pid = %d, io_rem = %d\n", p->cpu_remain, p->half_cpu, p->pid, p->io_remain);
          p->state = blocked;
          cur_run = null;
          if(cur_quant == quantum)
            cur_quant = 0;
        }
        else if(cur_quant == quantum && p->cpu_remain > 0)
        {
          p->state = ready;
          push(q, p);
          cur_quant = 0;
          cur_run = null;
        }
        else if(!p->cpu_remain && !p->io_remain)
        {
          p->state = final;
          p->finish_time = cycle - 1;
          cur_run = null;
          ++finish;
          printf("fin = %d\n", finish);
          if(finish == n_proc)
            break;
        }
      }
      else if(p->state == blocked && p->io_remain > 0)
      {
        // printf("%d:blocked\n", p->pid);
        --p->io_remain;
        if(!p->io_remain && p->cpu_remain > 0) /* when a process is blocked for i/o, and then ready, added to queue */
        {
          p->state = ready;
          push(q, p);
        }
      }
      else if(p->state == blocked && !p->io_remain)
      {
        p->state = ready;
        push(q, p);
      }
      if(p->pid == 2)
        printf("cycle = %d, cpu_rem = %d, half = %d, pid = %d, io_rem = %d, state = %d\n", cycle, p->cpu_remain, p->half_cpu, p->pid, p->io_remain, p->state);
    }
    
    if(finish == n_proc)
      break;
    qsort(q->a, q->cur, sizeof(proc *), compare_pid);
    if(!cur_run)
    {
      if(!is_empty(q))
        cur_run = (proc *)front(q);
      else
        continue;
      // printf("currun = %d\n", cur_run->pid);
      // if(cur_run->state == ready)
      if(cur_run)
        cur_run->state = running;
      printf("q\n");
      print_queue(q);
      printf("\n");
      pop(q);
    }
    fprint_proc(fp_out, proc_array, n_proc, cycle);
    ++cycle;
  }
  fprint_proc2(fp_out, proc_array, n_proc, cycle, cpu_work);
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
  int file_len = strlen(argv[2]) + 3; /* "%d-%s\0", %d in {0, 1, 2} */
  filename = (char *)mal(file_len);
  sprintf(filename, "%d-%s", scheduling, argv[2]); /* form output file name */
  int num_line = 0;
  char ** lines = file_to_array(fp_in, &num_line); /* print_lines(lines, num_line); */
  int n_proc = atoi(*lines),
  n_int = n_proc * 4 + 1;
  int * int_array = split(lines, num_line, n_int); /* print_int(int_array, n_int); */
  proc * proc_array[n_proc];
  int * int_ptr = int_array + 1;
  for(int i = 0; i < n_proc; ++i)
  {
    proc p = 
    {
      int_ptr[i * 4], int_ptr[i * 4 + 1], int_ptr[i * 4 + 2], int_ptr[i * 4 + 3],
      int_ptr[i * 4 + 1], int_ptr[i * 4 + 2], ceil(int_ptr[i * 4 + 1] / 2), -1, initial
    };
    proc_array[i] = (proc *)mal(sizeof(proc));
    memcpy(proc_array[i], &p, sizeof(proc));
  } /* for(int i = 0; i < n_proc; ++i) printf("%d %d %d %d %d %d %d %d %d\n", proc_array[i]->pid, proc_array[i]->cpu, proc_array[i]->io, proc_array[i]->arrival, proc_array[i]->cpu_remain, proc_array[i]->io_remain, proc_array[i]->half_cpu, proc_array[i]->finish_time, proc_array[i]->state); */
  qsort(proc_array, n_proc, sizeof(proc *), compare_pid);
  file * fp_out = fopen(filename, "w+");
  if(!scheduling)
    first_come_first_serve(fp_out, proc_array, n_proc);
  if(scheduling == 1)
    round_robin(fp_out, proc_array, n_proc, 2);
  fclose(fp_in); /* close processes file */
  fclose(fp_out);
  return 0;
}