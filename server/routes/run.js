const express = require('express');
const router = express.Router();

const Excel = require('exceljs');

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  organization: 'org-NjoJRKC7NSbtkJKQuiCsdcbf',
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);



router.post('/', async (req, res) => {
  const { message } = req.body;
  const response = await openai.ChatCompletion.create({
    model: "gpt-3.5-turbo",
    message: [
      {"role": "system", "content": "You are a creative writer."},
      {"role": "user", "content": "Who won the world series in 2020?"}
    ],
    max_tokens: 3000,
    temperature: 0.3,
  });
  res.json({ botResponse: response.data.choices[0].text });
});




router.post('/task', (req, res) => {
  try {
    const {doc, sheet, type} = req.body;

    let workbook = new Excel.Workbook();

    workbook.xlsx.readFile(doc).then(async () => {
      let worksheet = workbook.getWorksheet(sheet);

      let roles = {};
      for (let i = 1; i < 21; i ++) {
        if(worksheet.getCell('A' + i).value) {
          roles[worksheet.getCell('A' + i).value] = worksheet.getCell('B' + i).value;
        }
        if(worksheet.getCell('D' + i).value) {
          roles[worksheet.getCell('D' + i).value] = worksheet.getCell('E' + i).value;
        }
      }

      if(type === 'Build') {
        let colCount = worksheet.columnCount;
        let row1 = worksheet.getRow(21);
        
        for(let i = 22; i <= worksheet.rowCount; i ++) {
          let row = worksheet.getRow(i);
          let lastAnswer = '';
          
          for (let j = 3; j <= colCount; j ++) {
            let prompt = row1.getCell(j).value;
            
            if(prompt !== null && row.getCell('B').value !== null && row.getCell(j).value === null) {
              prompt = replaceCells(worksheet, row, roles, prompt);

              let response = {
                status: 0,
                data: {
                  error: null
                }
              };
            
              while(response.data.error || response.status !== 200) {
                console.log('sending prompt...............');
                console.log(prompt + '\n');

                try {
                  response = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [
                      {role: "system", content: roles['SystemRole']},
                      {role: "user", content: prompt}
                    ],
                    temperature: 0,
                    max_tokens: 2000,
                    top_p: 1,
                    frequency_penalty: 0.5,
                    presence_penalty: 0,
                  });
                } catch (err) {
                  //workbook.xlsx.writeFile(doc);
                  console.log(err);
                  continue;
                  //return res.status(500).json({error: 'Server Error'});
                }
              }
              lastAnswer = response.data.choices[0].message.content.trim();

              console.log('result-----------------------------------------');
              console.log(lastAnswer + '\n');
              
              row.getCell(j).value = lastAnswer;    
              row.getCell(j).font = {
                name: 'Arial',
                size: 16
              };    
            }
          }
          row.getCell(1).value = lastAnswer;
          row.getCell(1).font = {
            name: 'Arial',
            size: 16
          };  
        }
      } else if(type === 'Fixed') {
        let colCount = worksheet.columnCount;
        let row1 = worksheet.getRow(21);
        
        for(let i = 22; i <= worksheet.rowCount; i ++) {
          let row = worksheet.getRow(i);
          
          for (let j = 3; j <= colCount; j ++) {
            let prompt = row1.getCell(j).value;
            
            if(prompt !== null && row.getCell('B').value !== null && row.getCell(j).value === null) {
              prompt = replaceCells(worksheet, row, roles, prompt);

              let response = {
                status: 0
              };
            
              while(response.status !== 200) {
                console.log('sending prompt...............');
                console.log(prompt);

                try {
                  response = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [
                      {role: "system", content: roles['SystemRole']},
                      {role: "user", content: prompt}
                    ],
                    temperature: 0,
                    max_tokens: 2000,
                    top_p: 1,
                    frequency_penalty: 0.5,
                    presence_penalty: 0,
                  });
                } catch (error) {
                  //workbook.xlsx.writeFile(doc);

                  console.log('Server Error');
                  continue;
                  ///return res.status(500).json({error: 'Server Error'});
                }
              }
              
              row.getCell(j).value = response.data.choices[0].message.content.trim();
              row.getCell(j).font = {
                name: 'Arial',
                size: 16
              };

              console.log('done');
              console.log(row.getCell(j).value);

                 
            }
          }
        }
      } else if(type === 'If, Then') {
        let colCount = worksheet.columnCount;
        let row0 = worksheet.getRow(20);
        let row1 = worksheet.getRow(21);
        
        for(let i = 22; i <= worksheet.rowCount; i ++) {
          let row = worksheet.getRow(i);
          let lastAnswer = row.getCell('B').value;
          let score = row.getCell('C').value !== null ? -1 : 0;

          for(let j = 3; j <= colCount; j ++) {
            let question = row0.getCell(j).value;

            if(question !== null && lastAnswer !== null && row.getCell(j).value === null && score !== -1) {
              if(question === 'Question') {
                let prompt = row1.getCell(j).value;
  
                prompt = replaceCells(worksheet, row, roles, prompt);
                prompt = prompt + '{' + lastAnswer + '}';
  
                let response = {
                  status: 0
                };
                
                while(response.status !== 200) {
                  console.log('sending prompt...............');
                  console.log(prompt);
      
                  try{
                    response = await openai.createCompletion({
                      model: "text-davinci-003",
                      prompt,
                      temperature: 0,
                      max_tokens: 256,
                      top_p: 1,
                      frequency_penalty: 0.5,
                      presence_penalty: 0,
                    });
                  } catch (error) {
      
                    console.log('Server Error');
                    continue;
                  }
                }
                console.log('done');
                console.log(response.data.choices[0].text.trim());
  
                score = getScore(response.data.choices[0].text.trim());
                row.getCell(j).value = score;
                row.getCell(j).font = {
                  name: 'Arial',
                  size: 16
                };  
              } else if(question.match('<=')) {
                let cret = +question[question.search(/[1-9]/)];
  
                if(score <= cret) {
                  let prompt = row1.getCell(j).value;
                  prompt = replaceCells(worksheet, row, roles, prompt);
                  prompt = prompt + '{' + lastAnswer + '}';
  
                  let response = {
                    status: 0
                  };
                  
                  while(response.status !== 200) {
                    console.log('sending prompt...............');
                    console.log(prompt);
        
                    try{
                      response = await openai.createCompletion({
                        model: "text-davinci-003",
                        prompt,
                        temperature: 0,
                        max_tokens: 256,
                        top_p: 1,
                        frequency_penalty: 0.5,
                        presence_penalty: 0,
                      });
                    } catch (error) {
        
                      console.log('Server Error');
                      continue;
                    }
                  }
                  console.log('done');
                  console.log(response.data.choices[0].text.trim());
  
                  lastAnswer = response.data.choices[0].text.trim();
                  row.getCell(j).value = lastAnswer;
                  row.getCell(j).font = {
                    name: 'Arial',
                    size: 16
                  };  
                }
              } else if(question.match('>')) {
                let cret = +question[question.search(/[1-9]/)];
  
                if(score > cret) {
                  let prompt = row1.getCell(j).value;
                  prompt = replaceCells(worksheet, row, roles, prompt);
                  prompt = prompt + '{' + lastAnswer + '}';
  
                  let response = {
                    status: 0
                  };
                  
                  while(response.status !== 200) {
                    console.log('sending prompt...............');
                    console.log(prompt);
        
                    try{
                      response = await openai.createCompletion({
                        model: "text-davinci-003",
                        prompt,
                        temperature: 0,
                        max_tokens: 256,
                        top_p: 1,
                        frequency_penalty: 0.5,
                        presence_penalty: 0,
                      });
                    } catch (error) {
        
                      console.log('Server Error');
                      continue;
                    }
                  }
                  console.log('done');
                  console.log(response.data.choices[0].text.trim());
  
                  lastAnswer = response.data.choices[0].text.trim();
                  row.getCell(j).value = lastAnswer;
                  row.getCell(j).font = {
                    name: 'Arial',
                    size: 16
                  };  
                }
              }
            }
          }
          
          row.getCell('A').value = lastAnswer;
          row.getCell('A').font = {
            name: 'Arial',
            size: 16
          };  
        }
      } else if (type === 'Combo') {
        let subtype = '';
        let colCount = worksheet.columnCount;
        let row0 = null, row1 = null;

        for(let i = 21; i <= worksheet.rowCount; i ++) {
          let row = worksheet.getRow(i);
          let lastAnswer = '';

          if(row.getCell('D').value === 'Build') {
            subtype = 'Build';
            i += 1;
            row1 = worksheet.getRow(i);
          } else if(row.getCell('D').value === 'If, Then') {
            subtype = 'If, Then';
            row0 = worksheet.getRow(i);
            row1 = worksheet.getRow(i + 1);
            i += 1;
          } else {
            if(subtype === 'Build') {
              for (let j = 6; j <= colCount; j ++) {
                let prompt = row1.getCell(j).value;
            
                if(prompt !== null && row.getCell('E').value !== null && row.getCell(j).value === null && row.getCell(j).formula === undefined) {
                prompt = replaceCells(worksheet, row, roles, prompt);

                  let response = {
                    status: 0,
                    data: {
                      error: null
                    }
                  };
                
                  while(response.data.error || response.status !== 200) {
                    console.log('sending prompt...............');
                    console.log(prompt + '\n');

                    try {
                      response = await openai.createChatCompletion({
                        model: "gpt-3.5-turbo",
                        messages: [
                          {role: "system", content: roles['SystemRole']},
                          {role: "user", content: prompt}
                        ],
                        temperature: 0,
                        max_tokens: 2000,
                        top_p: 1,
                        frequency_penalty: 0.5,
                        presence_penalty: 0,
                      });
                    } catch (err) {
                      //workbook.xlsx.writeFile(doc);
                      console.log(err);
                      continue;
                      //return res.status(500).json({error: 'Server Error'});
                    }
                  }
                  lastAnswer = response.data.choices[0].message.content.trim();

                  console.log('result-----------------------------------------');
                  console.log(lastAnswer + '\n');
                  
                  row.getCell(j).value = lastAnswer;    
                  row.getCell(j).font = {
                    name: 'Arial',
                    size: 16
                  };    
                }
              }
              row.getCell('D').value = lastAnswer;
              row.getCell('D').font = {
                name: 'Arial',
                size: 16
              }; 
            } else if(subtype === 'If, Then') {
              lastAnswer = row.getCell('E').value;
              let score = row.getCell('F').value !== null ? -1 : 0;

              for(let j = 6; j <= colCount; j ++) {
                let question = row0.getCell(j).value;

                if(question !== null && lastAnswer !== null && row.getCell(j).value === null && score !== -1) {
                  if(question === 'Question') {
                    let prompt = row1.getCell(j).value;
      
                    prompt = replaceCells(worksheet, row, roles, prompt);
                    prompt = prompt + '{' + lastAnswer + '}';
      
                    let response = {
                      status: 0
                    };
                    
                    while(response.status !== 200) {
                      console.log('sending prompt...............');
                      console.log(prompt);
          
                      try{
                        response = await openai.createCompletion({
                          model: "text-davinci-003",
                          prompt,
                          temperature: 0,
                          max_tokens: 256,
                          top_p: 1,
                          frequency_penalty: 0.5,
                          presence_penalty: 0,
                        });
                      } catch (error) {
          
                        console.log('Server Error');
                        continue;
                      }
                    }
                    console.log('done');
                    console.log(response.data.choices[0].text.trim());
      
                    score = getScore(response.data.choices[0].text.trim());
                    row.getCell(j).value = score;
                    row.getCell(j).font = {
                      name: 'Arial',
                      size: 16
                    };  
                  } else if(question.match('<=')) {
                    let cret = +question[question.search(/[1-9]/)];
      
                    if(score <= cret) {
                      let prompt = row1.getCell(j).value;
                      prompt = replaceCells(worksheet, row, roles, prompt);
                      prompt = prompt + '{' + lastAnswer + '}';
      
                      let response = {
                        status: 0
                      };
                      
                      while(response.status !== 200) {
                        console.log('sending prompt...............');
                        console.log(prompt);
            
                        try{
                          response = await openai.createCompletion({
                            model: "text-davinci-003",
                            prompt,
                            temperature: 0,
                            max_tokens: 256,
                            top_p: 1,
                            frequency_penalty: 0.5,
                            presence_penalty: 0,
                          });
                        } catch (error) {
            
                          console.log('Server Error');
                          continue;
                        }
                      }
                      console.log('done');
                      console.log(response.data.choices[0].text.trim());
      
                      lastAnswer = response.data.choices[0].text.trim();
                      row.getCell(j).value = lastAnswer;
                      row.getCell(j).font = {
                        name: 'Arial',
                        size: 16
                      };  
                    }
                  } else if(question.match('>')) {
                    let cret = +question[question.search(/[1-9]/)];
      
                    if(score > cret) {
                      let prompt = row1.getCell(j).value;
                      prompt = replaceCells(worksheet, row, roles, prompt);
                      prompt = prompt + '{' + lastAnswer + '}';
      
                      let response = {
                        status: 0
                      };
                      
                      while(response.status !== 200) {
                        console.log('sending prompt...............');
                        console.log(prompt);
            
                        try{
                          response = await openai.createCompletion({
                            model: "text-davinci-003",
                            prompt,
                            temperature: 0,
                            max_tokens: 256,
                            top_p: 1,
                            frequency_penalty: 0.5,
                            presence_penalty: 0,
                          });
                        } catch (error) {
            
                          console.log('Server Error');
                          continue;
                        }
                      }
                      console.log('done');
                      console.log(response.data.choices[0].text.trim());
      
                      lastAnswer = response.data.choices[0].text.trim();
                      row.getCell(j).value = lastAnswer;
                      row.getCell(j).font = {
                        name: 'Arial',
                        size: 16
                      };  
                    }
                  }
                }
              }
              
              row.getCell('D').value = lastAnswer;
              row.getCell('D').font = {
                name: 'Arial',
                size: 16
              };  
            }
          }
        }
      } 
      workbook.xlsx.writeFile(doc);
      
      return res.status(200).json({res: 'Finished'});
    });
  } catch(err) {
    console.error(err.message);
    res.status(500).send({error: 'Server Error'});
  }
})




router.post('/project', (req, res) => {
  try {
    const {doc, tasks} = req.body;

    let workbook = new Excel.Workbook();

    workbook.xlsx.readFile(doc).then(async () => {
      for( let j = 0; j < tasks.length; j ++) {
        let {sheet, type} = tasks[j];
        let worksheet = workbook.getWorksheet(sheet);

        let roles = {};
        for (let i = 2; i < 21; i ++) {
          if(worksheet.getCell('A' + i).value) {
            roles[worksheet.getCell('A' + i).value] = worksheet.getCell('B' + i).value;
          }
          if(worksheet.getCell('D' + i).value) {
          roles[worksheet.getCell('D' + i).value] = worksheet.getCell('E' + i).value;
        }
        }

        if(type === 'Build') {
          let colCount = worksheet.columnCount;
          let row1 = worksheet.getRow(21);
          
          for(let i = 22; i <= worksheet.rowCount; i ++) {
            let row = worksheet.getRow(i);
            let lastAnswer = '';
            
            for (let j = 3; j <= colCount; j ++) {
              let prompt = row1.getCell(j).value;
              
              if(prompt !== null && row.getCell('B').value !== null && row.getCell(j).value === null) {
                prompt = replaceCells(worksheet, row, roles, prompt);
  
                let response = {
                  status: 0,
                  data: {
                    error: null
                  }
                };
              
                while(response.data.error || response.status !== 200) {
                  console.log('sending prompt...............');
                  console.log(prompt + '\n');
  
                  try {
                    response = await openai.createChatCompletion({
                      model: "gpt-3.5-turbo",
                      messages: [
                        {role: "system", content: roles['SystemRole']},
                        {role: "user", content: prompt}
                      ],
                      temperature: 0,
                      max_tokens: 2000,
                      top_p: 1,
                      frequency_penalty: 0.5,
                      presence_penalty: 0,
                    });
                  } catch (err) {
                    //workbook.xlsx.writeFile(doc);
                    console.log('Server Error');
                    continue;
                    //return res.status(500).json({error: 'Server Error'});
                  }
                }
                console.log('result-----------------------------------------');
                console.log(response.data.choices[0].message.content.trim() + '\n');
  
                lastAnswer = response.data.choices[0].message.content.trim();
                row.getCell(j).value = lastAnswer;      
                row.getCell(j).font = {
                  name: 'Arial',
                  size: 16
                };    
              }
            }
            row.getCell(1).value = lastAnswer;
            row.getCell(1).font = {
              name: 'Arial',
              size: 16
            };  
          }
        } else if(type === 'Fixed') {
          let colCount = worksheet.columnCount;
          let row1 = worksheet.getRow(21);
          
          for(let i = 22; i <= worksheet.rowCount; i ++) {
            let row = worksheet.getRow(i);
            
            for (let j = 3; j <= colCount; j ++) {
              let prompt = row1.getCell(j).value;
              
              if(prompt !== null && row.getCell('B').value !== null && row.getCell(j).value === null) {
                prompt = replaceCells(worksheet, row, roles, prompt);
  
                let response = {
                  status: 0
                };
              
                while(response.status !== 200) {
                  console.log('sending prompt...............');
                  console.log(prompt);
  
                  try {
                    response = await openai.createChatCompletion({
                      model: "gpt-3.5-turbo",
                      messages: [
                        {role: "system", content: roles['SystemRole']},
                        {role: "user", content: prompt}
                      ],
                      temperature: 0,
                      max_tokens: 2000,
                      top_p: 1,
                      frequency_penalty: 0.5,
                      presence_penalty: 0,
                    });
                  } catch (error) {
                    //workbook.xlsx.writeFile(doc);
  
                    console.log('Server Error');
                    continue;
                    ///return res.status(500).json({error: 'Server Error'});
                  }
                }
                console.log('done');
                console.log(response.data.choices[0].message.content.trim());
  
                row.getCell(j).value = response.data.choices[0].message.content.trim();         
                row.getCell(j).font = {
                  name: 'Arial',
                  size: 16
                };  
              }
            }
          }
        } else if(type === 'If, Then') {
          let colCount = worksheet.columnCount;
          let row0 = worksheet.getRow(20);
          let row1 = worksheet.getRow(21);
          
          for(let i = 22; i <= worksheet.rowCount; i ++) {
            let row = worksheet.getRow(i);
            let lastAnswer = row.getCell('B').value;
            let score = row.getCell('C').value !== null ? -1 : 0;
  
            for(let j = 3; j <= colCount; j ++) {
              let question = row0.getCell(j).value;
  
              if(question !== null && lastAnswer !== null && row.getCell(j).value === null && score !== -1) {
                if(question === 'Question') {
                  let prompt = row1.getCell(j).value;
    
                  prompt = replaceCells(worksheet, row, roles, prompt);
                  prompt = prompt + '{' + lastAnswer + '}';
    
                  let response = {
                    status: 0
                  };
                  
                  while(response.status !== 200) {
                    console.log('sending prompt...............');
                    console.log(prompt);
        
                    try{
                      response = await openai.createCompletion({
                        model: "text-davinci-003",
                        prompt,
                        temperature: 0,
                        max_tokens: 256,
                        top_p: 1,
                        frequency_penalty: 0.5,
                        presence_penalty: 0,
                      });
                    } catch (error) {
        
                      console.log('Server Error');
                      continue;
                    }
                  }
                  console.log('done');
                  console.log(response.data.choices[0].text.trim());
    
                  score = getScore(response.data.choices[0].text.trim());
                  row.getCell(j).value = score;
                  row.getCell(j).font = {
                    name: 'Arial',
                    size: 16
                  };  
                } else if(question.match('<=')) {
                  let cret = +question[question.search(/[1-9]/)];
    
                  if(score <= cret) {
                    let prompt = row1.getCell(j).value;
                    prompt = replaceCells(worksheet, row, roles, prompt);
                    prompt = prompt + '{' + lastAnswer + '}';
    
                    let response = {
                      status: 0
                    };
                    
                    while(response.status !== 200) {
                      console.log('sending prompt...............');
                      console.log(prompt);
          
                      try{
                        response = await openai.createCompletion({
                          model: "text-davinci-003",
                          prompt,
                          temperature: 0,
                          max_tokens: 256,
                          top_p: 1,
                          frequency_penalty: 0.5,
                          presence_penalty: 0,
                        });
                      } catch (error) {
          
                        console.log('Server Error');
                        continue;
                      }
                    }
                    console.log('done');
                    console.log(response.data.choices[0].text.trim());
    
                    lastAnswer = response.data.choices[0].text.trim();
                    row.getCell(j).value = lastAnswer;
                    row.getCell(j).font = {
                      name: 'Arial',
                      size: 16
                    };  
                  }
                } else if(question.match('>')) {
                  let cret = +question[question.search(/[1-9]/)];
    
                  if(score > cret) {
                    let prompt = row1.getCell(j).value;
                    prompt = replaceCells(worksheet, row, roles, prompt);
                    prompt = prompt + '{' + lastAnswer + '}';
    
                    let response = {
                      status: 0
                    };
                    
                    while(response.status !== 200) {
                      console.log('sending prompt...............');
                      console.log(prompt);
          
                      try{
                        response = await openai.createCompletion({
                          model: "text-davinci-003",
                          prompt,
                          temperature: 0,
                          max_tokens: 256,
                          top_p: 1,
                          frequency_penalty: 0.5,
                          presence_penalty: 0,
                        });
                      } catch (error) {
          
                        console.log('Server Error');
                        continue;
                      }
                    }
                    console.log('done');
                    console.log(response.data.choices[0].text.trim());
    
                    lastAnswer = response.data.choices[0].text.trim();
                    row.getCell(j).value = lastAnswer;
                    row.getCell(j).font = {
                      name: 'Arial',
                      size: 16
                    };  
                  }
                }
              }
            }
            
            row.getCell('A').value = lastAnswer;
            row.getCell('A').font = {
              name: 'Arial',
              size: 16
            };  
          }
        } else if (type === 'Combo') {
          let subtype = '';
          let colCount = worksheet.columnCount;
          let row0 = null, row1 = null;
  
          for(let i = 21; i <= worksheet.rowCount; i ++) {
            let row = worksheet.getRow(i);
            let lastAnswer = '';
  
            if(row.getCell('D').value === 'Build') {
              subtype = 'Build';
              i += 1;
              row1 = worksheet.getRow(i);
            } else if(row.getCell('D').value === 'If, Then') {
              subtype = 'If, Then';
              row0 = worksheet.getRow(i);
              row1 = worksheet.getRow(i + 1);
              i += 1;
            } else {
              if(subtype === 'Build') {
                for (let j = 6; j <= colCount; j ++) {
                  let prompt = row1.getCell(j).value;
              
                  if(prompt !== null && row.getCell('E').value !== null && row.getCell(j).value === null && row.getCell(j).formula === undefined) {
                    prompt = replaceCells(worksheet, row, roles, prompt);
  
                    let response = {
                      status: 0,
                      data: {
                        error: null
                      }
                    };
                  
                    while(response.data.error || response.status !== 200) {
                      console.log('sending prompt...............');
                      console.log(prompt + '\n');
  
                      try {
                        response = await openai.createChatCompletion({
                          model: "gpt-3.5-turbo",
                          messages: [
                            {role: "system", content: roles['SystemRole']},
                            {role: "user", content: prompt}
                          ],
                          temperature: 0,
                          max_tokens: 2000,
                          top_p: 1,
                          frequency_penalty: 0.5,
                          presence_penalty: 0,
                        });
                      } catch (err) {
                        //workbook.xlsx.writeFile(doc);
                        console.log(err);
                        continue;
                        //return res.status(500).json({error: 'Server Error'});
                      }
                    }
                    lastAnswer = response.data.choices[0].message.content.trim();
  
                    console.log('result-----------------------------------------');
                    console.log(lastAnswer + '\n');
                    
                    row.getCell(j).value = lastAnswer;    
                    row.getCell(j).font = {
                      name: 'Arial',
                      size: 16
                    };    
                  }
                }
                row.getCell('D').value = lastAnswer;
                row.getCell('D').font = {
                  name: 'Arial',
                  size: 16
                }; 
              } else if(subtype === 'If, Then') {
                lastAnswer = row.getCell('E').value;
                let score = row.getCell('F').value !== null ? -1 : 0;
  
                for(let j = 6; j <= colCount; j ++) {
                  let question = row0.getCell(j).value;
  
                  if(question !== null && lastAnswer !== null && row.getCell(j).value === null && score !== -1 && row.getCell(j).formula === undefined) {
                    if(question === 'Question') {
                      let prompt = row1.getCell(j).value;
        
                      prompt = replaceCells(worksheet, row, roles, prompt);
                      prompt = prompt + '{' + lastAnswer + '}';
        
                      let response = {
                        status: 0
                      };
                      
                      while(response.status !== 200) {
                        console.log('sending prompt...............');
                        console.log(prompt);
            
                        try{
                          response = await openai.createCompletion({
                            model: "text-davinci-003",
                            prompt,
                            temperature: 0,
                            max_tokens: 256,
                            top_p: 1,
                            frequency_penalty: 0.5,
                            presence_penalty: 0,
                          });
                        } catch (error) {
            
                          console.log('Server Error');
                          continue;
                        }
                      }
                      console.log('done');
                      console.log(response.data.choices[0].text.trim());
        
                      score = getScore(response.data.choices[0].text.trim());
                      row.getCell(j).value = score;
                      row.getCell(j).font = {
                        name: 'Arial',
                        size: 16
                      };  
                    } else if(question.match('<=')) {
                      let cret = +question[question.search(/[1-9]/)];
        
                      if(score <= cret) {
                        let prompt = row1.getCell(j).value;
                        prompt = replaceCells(worksheet, row, roles, prompt);
                        prompt = prompt + '{' + lastAnswer + '}';
        
                        let response = {
                          status: 0
                        };
                        
                        while(response.status !== 200) {
                          console.log('sending prompt...............');
                          console.log(prompt);
              
                          try{
                            response = await openai.createCompletion({
                              model: "text-davinci-003",
                              prompt,
                              temperature: 0,
                              max_tokens: 256,
                              top_p: 1,
                              frequency_penalty: 0.5,
                              presence_penalty: 0,
                            });
                          } catch (error) {
              
                            console.log('Server Error');
                            continue;
                          }
                        }
                        console.log('done');
                        console.log(response.data.choices[0].text.trim());
        
                        lastAnswer = response.data.choices[0].text.trim();
                        row.getCell(j).value = lastAnswer;
                        row.getCell(j).font = {
                          name: 'Arial',
                          size: 16
                        };  
                      }
                    } else if(question.match('>')) {
                      let cret = +question[question.search(/[1-9]/)];
        
                      if(score > cret) {
                        let prompt = row1.getCell(j).value;
                        prompt = replaceCells(worksheet, row, roles, prompt);
                        prompt = prompt + '{' + lastAnswer + '}';
        
                        let response = {
                          status: 0
                        };
                        
                        while(response.status !== 200) {
                          console.log('sending prompt...............');
                          console.log(prompt);
              
                          try{
                            response = await openai.createCompletion({
                              model: "text-davinci-003",
                              prompt,
                              temperature: 0,
                              max_tokens: 256,
                              top_p: 1,
                              frequency_penalty: 0.5,
                              presence_penalty: 0,
                            });
                          } catch (error) {
              
                            console.log('Server Error');
                            continue;
                          }
                        }
                        console.log('done');
                        console.log(response.data.choices[0].text.trim());
        
                        lastAnswer = response.data.choices[0].text.trim();
                        row.getCell(j).value = lastAnswer;
                        row.getCell(j).font = {
                          name: 'Arial',
                          size: 16
                        };  
                      }
                    }
                  }
                }
                
                row.getCell('D').value = lastAnswer;
                row.getCell('D').font = {
                  name: 'Arial',
                  size: 16
                };  
              }
            }
          }
        } 
        
      };

      workbook.xlsx.writeFile(doc);

      return res.status(200).json({res: 'Finished'});
    });
  } catch(err) {
    console.log(err.message);

    res.status(500).send({error: 'Server Error'});
  }
})



const replaceCells = (sheet, row, roles, prompt) => {
  let index;

  //  {B}
  while(index = prompt.match(/{[A-Z]}/)) {   
    index = index[0];
    prompt = prompt.replace(index, row.getCell(index.slice(1, -1)).value);
  }

  //  {B22}
  while(index = prompt.match(/{[A-Z][0-9]+}/)) {
    index = index[0];
    prompt = prompt.replace(index, sheet.getCell(index.slice(1, -1)).value);
  }

  //  {Role}
  while(index = prompt.match(/{[A-z]+}/)) {
    index = index[0];
    prompt = prompt.replace(index, roles[index.slice(1, -1)]);
  }

  return prompt;
}




const getScore = (answer) => {
  let first = answer.search(/[1-9]/);

  if(answer[first] === '1' && answer[first+1] === '0') return 10;
  else return +answer[first];
}

module.exports = router;