

exports.err_404 = (req, resp, next) =>{
  //ejs uses .render instead of .sendFile
  resp.status(404).render('errors/404', {path: '/404',
                                  page_title: '404 Page Not Found'});
    //.render(view_file_name_w_out_ext, obj_vars_to_pass_to_view)
};



exports.err_500 = (req, resp, next) =>{
  //ejs uses .render instead of .sendFile
  resp.status(404).render('errors/500', {path: '/500',
                                  page_title: '500 Server Error'});
    //.render(view_file_name_w_out_ext, obj_vars_to_pass_to_view)
};