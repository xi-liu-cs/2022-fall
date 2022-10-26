import pandas as pd
import numpy as np

class node():
    def __init__(self, left = None, right = None, feature = None, threshold = None, gain = None, value = None):
        self.left = left
        self.right = right
        self.feature = feature
        self.threshold = threshold
        self.gain = gain
        self.value = value

class decision_tree():
    def __init__(self, min_split = 2, max_depth = 30):
        self.root = None
        self.min_split = min_split
        self.max_depth = max_depth
    
    def entropy(self, a):
        label = np.unique(a)
        entropy = 0
        for i in range(len(label)):
            percent = len(a[a == label[i]]) / len(a)
            entropy += -percent * np.log2(percent)
        return entropy

    def information_gain(self, parent, left, right):
        percent_left = len(left) / len(parent)
        percent_right = len(right) / len(parent)
        return self.entropy(parent) - percent_left * self.entropy(left) - percent_right * self.entropy(right)
        
    def make_tree(self, data, depth = 0):
        x, y = data[:, :-1], data[:, -1]
        n_sample, n_feature = np.shape(x)
        if depth <= self.max_depth and self.min_split <= n_sample:
            split = self.find_split(data, n_sample, n_feature)
            if split['gain'] > 0:
                left = self.make_tree(split['left'], depth + 1)
                right = self.make_tree(split['right'], depth + 1)
                return node(left, right, split['feature'], split['threshold'], split['gain'])
        y = list(y)
        return node(value = max(y, key = y.count))

    def split(self, data, feat, thresh):
        left = np.array([r for r in data if r[feat] <= thresh])
        right = np.array([r for r in data if r[feat] > thresh])
        return left, right

    def find_split(self, data, n_sample, n_feature):
        split = {}
        max_gain = -float('inf')
        for feature in range(n_feature):
            feature_val = data[:, feature]
            candidate_threshold = np.unique(feature_val)
            for threshold in candidate_threshold:
                left, right = self.split(data, feature, threshold)
                if 0 < len(left) and 0 < len(right):
                    y, left_y, right_y = data[:, -1], left[:, -1], right[:, -1]
                    gain = self.information_gain(y, left_y, right_y)
                    if max_gain < gain:
                        split['left'] = left
                        split['right'] = right
                        split['feature'] = feature
                        split['threshold'] = threshold
                        split['gain'] = gain
                        max_gain = gain
        return split
    
    def fit(self, x, y):
        data = np.concatenate((x, y), axis = 1)
        self.root = self.make_tree(data)
    
    def pred(self, tree, x):
        if tree.value != None:
            return tree.value
        feat = x[tree.feature]
        if feat <= tree.threshold:
            return self.pred(tree.left, x)
        else:
            return self.pred(tree.right, x)
    
    def predict(self, x):
        return [self.pred(self.root, i) for i in x]

import numpy as np
from sklearn import datasets
from sklearn.model_selection import train_test_split

def accuracy(y_test, y_pred):
    a = 0
    n_y_test = len(y_test)
    count = 0
    for i in range(len(y_test)):
        if(y_test[i] == y_pred[i]):
            count += 1
    return count / n_y_test

df_train = pd.read_csv('data2.csv', header = None)
df_test = pd.read_csv('test2.csv', header = None)

x_train = df_train.iloc[:, :-1].values
x_test = df_test.iloc[:, :-1].values
y_train = df_train.iloc[:, -1].values.reshape(-1, 1) # last column is boolean class label
y_test = df_test.iloc[:, -1].values.reshape(-1, 1)

classifier = decision_tree()
classifier.fit(x_train, y_train)

y_pred = classifier.predict(x_train)
acc = accuracy(y_train, y_pred)
print('train accuracy:', acc)

y_pred = classifier.predict(x_test)
acc = accuracy(y_test, y_pred)
print('test accuracy:', acc)

f = open('xl3504_extracredit.out', 'w')
for i in range(len(y_pred)):
    f.write(str(y_pred[i]) + ' ')